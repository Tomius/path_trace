var fsTraceSrc =
`
    precision highp float;
    varying vec3 viewDirToNormalize;
    varying vec2 texCoord;
    uniform vec3 eye;
    uniform mat4 quadrics[32];
    uniform vec4 materials[16];
    uniform int framesSinceLastAction;
    uniform sampler2D tex;

    const int kSampleCount = 1;
    const int kTraceDepth = 1;
    const float kPi = 3.14159265359;
    const vec3 kLampStart = vec3(-1.1, 2, -0.1);
    const vec3 kLampSize = vec3(0.2, 0.01, 0.2);

    float rand(float n){ return fract(sin(n) * 43758.5453123); }

    vec3 PointOnLightSource(vec3 seed) {
      return kLampStart + kLampSize * vec3(
        rand(dot(vec3(0.15478, -1.75416, 9.245154), seed)),
        0,
        rand(dot(vec3(7.645153, 0.123548, -3.54874), seed)));
    }

    mat3 TBN(vec3 normal) {
      mat3 tbn;
      tbn[1] = normal;

      vec3 up = vec3(0.0, 1.0, 0.0), right = vec3(1.0, 0.0, 0.0);
      tbn[0] = normalize(dot(up, normal) < dot(right, normal) ? cross(up, normal) : cross(right, normal));
      tbn[2] = normalize(cross(tbn[0], tbn[1]));

      return tbn;
    }

    float intersectClippedQuadric(mat4 A, mat4 B, vec4 e, vec4 d) {
      float a = dot( d, A * d);
      float b = dot( e, A * d) + dot(d, A * e );
      float c = dot( e, A * e );

      float discr = b * b - 4.0 * a * c;
      if (discr < 0.0)
        return -1.0;
      float sqrt_discr = sqrt( discr );
      float t1 = (-b + sqrt_discr)/2.0/a;
      float t2 = (-b - sqrt_discr)/2.0/a;

      vec4 hit1 = e + d * t1;
      vec4 hit2 = e + d * t2;
      if (dot( hit1, B * hit1) > 0.0)
        t1 = -1.0;
      if (dot( hit2, B * hit2) > 0.0)
        t2 = -1.0;

      float t = (t1<t2)?t1:t2;
      if (t < 0.0)
        t = (t1<t2)?t2:t1;
      return t;
    }

    vec3 getQuadricNormal(mat4 A, vec4 hit) {
      return (A*hit + hit*A).xyz;
    }

    bool intersect(in vec4 e, in vec4 d, out float bestT, out int bestIndex,
                   out vec4 bestMaterial, out mat4 bestQuadric) {
      bestT = 10000.0;

      for (int i = 0; i < 2; i++) {
        float t = intersectClippedQuadric(quadrics[2*i], quadrics[2*i+1], e, d);
        if (0.0 < t && t < bestT) {
          bestT = t;
          bestIndex = i;
          bestQuadric = quadrics[2*i];
          bestMaterial = materials[i];
        }
      }

      // plane at y = -0.5
      float t = (-0.5 - e.y) / d.y;
      if (0.0 < t && t < bestT) {
        bestT = t;
        bestIndex = 2;
        bestQuadric = mat4(0.0);
        bestMaterial = vec4(1, 1, 1, 0);
      }

      // lamp
      t = (2.01-e.y) / d.y;
      if (0.0 < t && t < bestT) {
        vec4 p = e + t*d;
        if (kLampStart.x <= p.x && p.x <= kLampStart.x + kLampSize.x &&
            kLampStart.z <= p.z && p.z <= kLampStart.z + kLampSize.z) {
          bestT = t;
          bestIndex = 3;
          bestQuadric = mat4(0.0);
          bestMaterial = vec4(1, 1, 1, 0);
        }
      }


      return bestT < 9999.0;
    }

    vec3 trace(inout vec4 e, inout vec4 d, inout vec3 discoloration, float sample_id, float trace_depth, out float multiplier)
    {
      float bestT, bestT2;
      int bestIndex, bestIndex2;
      vec4 bestMaterial, bestMaterial2;
      mat4 bestQuadric, bestQuadric2;
      vec3 lighting = vec3(0.0);

      bool wasHit = intersect(e, d, bestT, bestIndex, bestMaterial, bestQuadric);

      if (wasHit) {
        multiplier = 1.0;
        bestMaterial = vec4(1, 1, 1, 0);
        lighting = vec3(1, 1, 0);
      } else {
        multiplier = 1.0;
        bestMaterial = vec4(1, 1, 1, 0);
        lighting = vec3(0.15, 0.25, 0.35);
      }

      discoloration *= bestMaterial.rgb;

      return lighting * discoloration;
    }

    void main() {
      vec4 d0 = vec4(normalize(viewDirToNormalize), 0.0);
      vec4 e0 = vec4(eye, 1.0);

      vec3 outColor = vec3(0.0);
      for (int sample = 0; sample < kSampleCount; sample++) {
        vec4 d = d0, e = e0;
        float multiplier = 1.0;
        vec3 discoloration = vec3(1.0);
        for (int trace_depth = 0; trace_depth < kTraceDepth; trace_depth++) {
          float oldMultiplier = multiplier;
          float randomSeed = fract(0.7544*float(framesSinceLastAction)) + 0.47931*float(kTraceDepth*sample) + 1.7415*float(trace_depth);
          outColor += oldMultiplier * trace(e, d, discoloration, randomSeed, float(trace_depth), multiplier);
        }
      }

      vec3 finalColor = outColor / float(kSampleCount);

      // if (framesSinceLastAction > 0) {
      //   vec3 oldColor = texture2D(tex, texCoord).rgb;
      //   finalColor = mix(oldColor, finalColor, 1.0 / float(framesSinceLastAction));
      // }

      gl_FragColor = vec4(finalColor, 1.0);
    }

`
;

