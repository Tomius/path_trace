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
    const int kTraceDepth = 2;
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
      return 2.0*(A*hit).xyz;
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
        vec4 hit = e + d*bestT;
        vec3 normal = bestIndex >= 2 ? vec3(0, 1, 0) : normalize(getQuadricNormal(bestQuadric, hit));
        if (dot(d.xyz, normal) > 0.0) {
          normal = -normal;
        }
        e = hit + vec4(normal, 0.0) * 0.001;

        // calc lighting
        const vec3 lightColor = 16.0 * vec3(0.9, 0.9, 0.85); 
        if (bestIndex == 3 && trace_depth == 0.0) {
          vec3 light = PointOnLightSource(hit.xyz + vec3(sample_id));
          vec3 toLight = light - e.xyz;
          lighting = lightColor / (1.0 + dot(toLight, toLight));
        } else {
          vec3 light = PointOnLightSource(hit.xyz + vec3(sample_id));
          vec3 toLight = light - hit.xyz;
          float toLightLen = length(toLight);
          vec3 toLightDir = toLight / toLightLen;
          bool inShadow = intersect(e, vec4(toLightDir, 0), bestT2, bestIndex2, bestMaterial2, bestQuadric2);
          if (!inShadow || bestT2 > toLightLen) {
            lighting += max(dot(toLightDir, normal), 0.0) / (1.0 + toLightLen*toLightLen) * lightColor;
          }
        }

        // generate new dir
        float rand1 = rand(dot(vec3(256, 16, 1), hit.xyz) + sample_id);
        float rand2 = rand(dot(vec3(256, 16, 1), hit.xyz) - sample_id);
        float longitude = 2.0 * kPi * rand1;
        float latitude = acos(sqrt(rand2)) / 2.0;
        float cos_latitude = cos(latitude);
        float sin_latitude = sin(latitude);
        multiplier = 1.0 / cos_latitude;
        vec3 cartesian = vec3(
          sin_latitude * sin(longitude),
          cos_latitude,
          sin_latitude * cos(longitude));
        vec3 diffuse_reflection_dir = TBN(normal) * cartesian;
        vec3 mirror_reflection_dir = reflect(d.xyz, normal);
        d = vec4(mix(diffuse_reflection_dir, mirror_reflection_dir, bestMaterial.w), 0);
      } else {
        multiplier = 1.0;
        bestMaterial = vec4(1, 1, 1, 0);
        lighting = vec3(0.15, 0.25, 0.35);
      }

      discoloration *= bestMaterial.rgb;

      return lighting * discoloration;
    }

    float ToneMap_Internal(float x) {
      float A = 0.22;
      float B = 0.30;
      float C = 0.10;
      float D = 0.20;
      float E = 0.01;
      float F = 0.30;

      return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F)) - E/F;
    }

    float Luminance(vec3 c) {
      return sqrt(0.299 * c.r*c.r + 0.587 * c.g*c.g + 0.114 * c.b*c.b);
    }

    vec3 ToneMap(vec3 color) {
      float luminance = Luminance(color);
      if (luminance < 1e-3) {
        return color;
      }
      float newLuminance = ToneMap_Internal(luminance) / ToneMap_Internal(11.2);
      return color * newLuminance / luminance;
    }


    void main() {
      vec4 d0 = vec4(normalize(viewDirToNormalize), 0.0);
      vec4 e0 = vec4(eye, 1.0);

      vec3 outColor = vec3(0.0);
      for (int sample = 0; sample < kSampleCount; sample++) {
        vec4 dir_offset = 0.001*vec4(rand(float(sample)) - 0.5, rand(float(sample)+1.0) - 0.5, rand(float(sample)+2.0) - 0.5, 0.0);
        vec4 d = normalize(d0 + dir_offset), e = e0;
        float multiplier = 1.0;
        vec3 discoloration = vec3(1.0);
        for (int trace_depth = 0; trace_depth < kTraceDepth; trace_depth++) {
          float oldMultiplier = multiplier;
          float randomSeed = fract(0.7544*float(framesSinceLastAction)) + 0.47931*float(kTraceDepth*sample) + 1.7415*float(trace_depth);
          outColor += oldMultiplier * trace(e, d, discoloration, randomSeed, float(trace_depth), multiplier);
        }
      }

      vec3 finalColor = ToneMap(outColor / float(kSampleCount));

      if (framesSinceLastAction > 0) {
        vec3 oldColor = texture2D(tex, texCoord).rgb;
        finalColor = mix(oldColor, finalColor, 1.0 / float(framesSinceLastAction+1));
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }

`
;

