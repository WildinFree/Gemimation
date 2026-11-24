"""Optional, standard-library timing and review helpers for an uploaded animation task."""
import json
import math
import os
import re
import sys
import wave


def _number(value, label, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(label + " must be a finite number")
    if positive and value <= 0:
        raise ValueError(label + " must be positive")
    return float(value)


def _fps(value):
    return _number(value, "fps", positive=True)


def frame_at(seconds, fps=30):
    """Nearest frame; nonnegative times use round-half-up rather than bankers' rounding."""
    seconds = _number(seconds, "time")
    if seconds < 0:
        raise ValueError("time cannot be negative")
    return math.floor(seconds * _fps(fps) + 0.5)


def audio_info(source):
    """Read PCM WAV metadata without changing, transcribing or decoding other formats."""
    if isinstance(source, (str, os.PathLike)):
        source = os.fspath(source)
    try:
        with wave.open(source, "rb") as recording:
            if recording.getcomptype() != "NONE":
                raise ValueError("Only uncompressed PCM WAV is supported")
            frames = recording.getnframes()
            rate = recording.getframerate()
            return {
                "channels": recording.getnchannels(),
                "sample_rate": rate,
                "sample_width_bytes": recording.getsampwidth(),
                "sample_frames": frames,
                "duration": frames / rate,
                "timing_source": "WAV sample count; no word alignment performed",
            }
    except (wave.Error, EOFError) as exc:
        raise ValueError("Cannot read PCM WAV; use available audio tools for other formats") from exc


def timing_map(words, fps=30, duration=None):
    """Map supplied alignment. Offsets are planning suggestions, not measured acting cues."""
    fps = _fps(fps)
    if duration is not None:
        duration = _number(duration, "duration", positive=True)
    if not isinstance(words, list):
        raise ValueError("words must be a list of word/text, start and end records")
    rows, occurrences, ids = [], {}, set()
    previous = -1
    for index, item in enumerate(words):
        label = "word " + str(index)
        if not isinstance(item, dict):
            raise ValueError(label + " must be an object")
        text = item.get("word", item.get("text"))
        if not isinstance(text, str) or not text.strip():
            raise ValueError(label + " needs nonempty word/text")
        start = _number(item.get("start"), label + " start")
        end = _number(item.get("end"), label + " end")
        if start < 0 or end < start or (duration is not None and end > duration + 1e-7):
            raise ValueError(label + " has an out-of-range interval")
        if start < previous:
            raise ValueError("word records must be in start-time order")
        previous = start
        token = re.sub(r"\W+", "_", text.casefold()).strip("_") or "word"
        occurrences[token] = occurrences.get(token, 0) + 1
        key = item.get("id", token + "_" + str(occurrences[token]))
        if not isinstance(key, str) or not key.strip() or key in ids:
            raise ValueError(label + " needs a unique nonempty id")
        ids.add(key)
        rows.append({
            "id": key, "word": text, "occurrence": occurrences[token],
            "start": start, "end": end,
            "start_frame": frame_at(start, fps), "end_frame": frame_at(end, fps),
            "suggested_camera_arrival": max(0, start - 1 / 6),
            "suggested_reaction_window": [max(0, start - 0.1), start],
            "suggested_mouth_lead_window": [max(0, start - 1 / fps), start],
        })
    return {"fps": fps, "words": rows, "note": "Supplied word timings only; suggested cue windows need story/audio review"}


def audit_plan(plan):
    """Check timeline structure. This never certifies visual quality or speech synchronization."""
    errors, warnings = [], []
    if not isinstance(plan, dict):
        return {"errors": ["plan must be an object"], "warnings": []}
    try:
        fps = _fps(plan.get("fps", 30))
        duration = _number(plan.get("duration"), "duration", positive=True)
    except ValueError as exc:
        return {"errors": [str(exc)], "warnings": []}

    def time(value, label, exclusive=False):
        value = _number(value, label)
        if value < 0 or value > duration + 1e-7 or (exclusive and value >= duration):
            raise ValueError(label + " must fall within the video")
        return value

    takes = plan.get("takes", [])
    if not isinstance(takes, list) or not takes:
        errors.append("takes must be a nonempty list")
        takes = []
    intervals, ids = [], set()
    for index, take in enumerate(takes):
        label = "take " + str(index)
        try:
            if not isinstance(take, dict):
                raise ValueError(label + " must be an object")
            key = take.get("id")
            if not isinstance(key, str) or not key.strip() or key in ids:
                raise ValueError(label + " needs a unique nonempty id")
            ids.add(key)
            start = time(take.get("start"), label + " start", exclusive=True)
            end = time(take.get("end"), label + " end")
            if end <= start:
                raise ValueError(label + " must have positive length")
            intervals.append((start, end))
            keys = take.get("keyframes", [])
            risks = take.get("risks", [])
            if not isinstance(keys, list) or not isinstance(risks, list):
                raise ValueError(label + " keyframes/risks must be lists")
            for value in keys:
                value = time(value, label + " keyframe")
                if not start <= value < end:
                    raise ValueError(label + " keyframe lies outside its take")
            for risk in risks:
                if not isinstance(risk, dict):
                    raise ValueError(label + " risk must be an interval object")
                a = time(risk.get("start"), label + " risk start")
                b = time(risk.get("end"), label + " risk end")
                if not start <= a < b <= end:
                    raise ValueError(label + " risk lies outside its take or is empty")
        except ValueError as exc:
            errors.append(str(exc))
    position = 0.0
    for start, end in sorted(intervals):
        if start > position + 1e-7:
            errors.append("Uncovered timeline gap at " + str(position))
        elif start < position - 1e-7:
            errors.append("Overlapping take ownership at " + str(start))
        position = max(position, end)
    if position < duration - 1e-7:
        errors.append("Takes do not reach the video end")
    if intervals and intervals != sorted(intervals):
        warnings.append("Takes are not listed chronologically")

    known_ids = plan.get("word_ids")
    if known_ids is not None:
        if not isinstance(known_ids, list) or any(not isinstance(key, str) or not key.strip() for key in known_ids):
            errors.append("word_ids must be a list of nonempty strings")
            known_ids = None
        elif len(known_ids) != len(set(known_ids)):
            errors.append("word_ids must be unique")
    unverified_ids = False
    for field in ("transitions", "events"):
        items = plan.get(field, [])
        if not isinstance(items, list):
            errors.append(field + " must be a list")
            continue
        for index, item in enumerate(items):
            label = field + " " + str(index)
            try:
                if not isinstance(item, dict):
                    raise ValueError(label + " must be an object")
                t = time(item.get("time"), label + " time", exclusive=field == "events")
                if field == "events":
                    if not isinstance(item.get("label"), str) or not item["label"].strip():
                        raise ValueError(label + " needs a nonempty label")
                    if "word_id" in item:
                        key = item["word_id"]
                        if not isinstance(key, str) or not key.strip():
                            raise ValueError(label + " word_id must be a nonempty string")
                        if known_ids is None:
                            unverified_ids = True
                        elif key not in known_ids:
                            raise ValueError(label + " references unknown word_id " + key)
                if field == "transitions":
                    length = _number(item.get("duration"), label + " duration", positive=True)
                    if length > duration:
                        raise ValueError(label + " is longer than the video")
                    if item.get("kind") == "loop":
                        if abs(t - duration) > 1e-7:
                            raise ValueError(label + " loop time must be the exclusive video end")
                    elif t - length / 2 < 0 or t + length / 2 > duration:
                        warnings.append(label + " span extends outside the video and review will clamp it")
                    if "anchor" in item:
                        anchor = time(item["anchor"], label + " anchor")
                        if abs(t - anchor) > 2 / 30 + 1e-7:
                            warnings.append(label + " is more than 0.067 s from its word anchor")
            except ValueError as exc:
                errors.append(str(exc))
    if unverified_ids:
        warnings.append("Event word IDs are unverified: supply word_ids from the timing map")
    return {"errors": errors, "warnings": warnings}


def review_schedule(plan, every_frame=False):
    """Return review-frame indices. Selected samples are not an all-frame inspection."""
    issues = audit_plan(plan)
    if issues["errors"]:
        raise ValueError("; ".join(issues["errors"]))
    fps = _fps(plan.get("fps", 30))
    duration = float(plan["duration"])
    total = math.ceil(duration * fps)
    selected = set()

    def add(frame):
        if 0 <= frame < total:
            selected.add(frame)

    def around(t, radius=2):
        centre = frame_at(t, fps)
        for f in range(centre - radius, centre + radius + 1):
            add(f)

    def span(a, b, margin=0):
        for f in range(max(0, math.floor(a * fps) - margin), min(total, math.ceil(b * fps) + margin)):
            add(f)

    if every_frame:
        selected.update(range(total))
    else:
        for f in [0, 1, 2, total - 3, total - 2, total - 1]:
            add(f)
        for take in plan["takes"]:
            a = math.ceil(take["start"] * fps)
            b = min(total, math.ceil(take["end"] * fps)) - 1
            for f in [a, a + 1, a + 2, (a + b) // 2, b - 2, b - 1, b]:
                add(f)
            for t in take.get("keyframes", []):
                around(t)
            for risk in take.get("risks", []):
                span(risk["start"], risk["end"], 2)
        for transition in plan.get("transitions", []):
            t, length = transition["time"], transition["duration"]
            if transition.get("kind") == "loop":
                span(t - length, t, 2)
                span(0, length, 2)
            else:
                span(t - length / 2, t + length / 2, 2)
        for event in plan.get("events", []):
            around(event["time"], 3)
    frames = sorted(selected)
    return {
        "fps": fps, "duration": duration, "total_frames": total,
        "coverage": "all frames" if every_frame else "selected review frames; unseen frames remain unchecked",
        "frames": frames, "times": [round(f / fps, 9) for f in frames],
        "warnings": issues["warnings"],
    }


def smootherstep(u):
    """Symmetric zero-speed camera arrival/departure curve."""
    x = min(1.0, max(0.0, _number(u, "progress")))
    return x * x * x * (x * (6 * x - 15) + 10)


def snap(u):
    """Quick acting progress, without automatic overshoot or randomized drift."""
    values = [0, .05, .16, .31, .48, .66, .79, .88, .93, .96, .98, .99, 1]
    position = min(1.0, max(0.0, _number(u, "progress"))) * 12
    i = min(11, int(position))
    return values[i] + (values[i + 1] - values[i]) * (position - i)


def process_request(request):
    if not isinstance(request, dict):
        raise ValueError("request must be an object")
    action = request.get("action")
    if action == "audio-info":
        return audio_info(request["source"])
    if action == "timing-map":
        return timing_map(request["words"], request.get("fps", 30), request.get("duration"))
    if action == "review-plan":
        plan = request["plan"]
        issues = audit_plan(plan)
        return {"audit": issues, "review": None if issues["errors"] else review_schedule(plan, request.get("every_frame", False))}
    raise ValueError("Unknown action; use audio-info, timing-map or review-plan")


if __name__ == "__main__":
    try:
        result = process_request(json.load(sys.stdin))
    except (ValueError, KeyError, OSError) as exc:
        result = {"error": str(exc)}
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)
    print(json.dumps(result, ensure_ascii=False))
