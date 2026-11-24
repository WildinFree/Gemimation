import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Vector2 } from "three";
import type { TxState } from "../camera/transitions";
const frag = `
uniform float whip;      // streak length, px at 1080x1920
uniform vec2 whipDir;    // image motion direction, y down
#define TAPS 24
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;
  if (whip > 0.5) {
    vec2 d = normalize(vec2(whipDir.x, -whipDir.y)) * whip * (resolution.y / 1920.0) * texelSize;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < TAPS; i++) acc += texture2D(inputBuffer, uv + d * ((float(i) + 0.5) / float(TAPS) - 0.5)).rgb;
    col = acc / float(TAPS);
  }
  outputColor = vec4(col, inputColor.a);
}`;
export class TransitionEffect extends Effect {
  constructor() {
    super("TransitionEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([["whip", new Uniform(0)], ["whipDir", new Uniform(new Vector2(-1, 0))]])
    });
  }
  set(t: TxState) {
    this.uniforms.get("whip")!.value = t.whip;
    (this.uniforms.get("whipDir")!.value as Vector2).set(...t.dir);
  }
}
