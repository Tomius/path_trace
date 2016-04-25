var fsTraceSrc =
`
    precision highp float;
    varying vec3 viewDirToNormalize;
    uniform vec3 eye;
    uniform mat4 quadrics[32];
    uniform vec4 materials[16];
    // const int kLightSampleCount = 16;
    const int kSampleCount = 16;
    const int kReflectionCount = 1;
    const float kPi = 3.14159265359;

    float rand(float n){ return fract(sin(n) * 43758.5453123); }

    vec3 PointOnLightSource(vec3 seed) {
      return vec3(-1.1, 2, -0.1) + vec3(0.2 * rand(seed.x), 0, 0.2 * rand(seed.z));
    }

    mat3 TBN(vec3 normal) {
      mat3 tbn;
      tbn[1] = normal;

      vec3 up = vec3(0.0, 1.0, 0.0), right = vec3(1.0, 0.0, 0.0);
      tbn[0] = normalize(dot(up, normal) < dot(right, normal) ? cross(up, normal) : cross(right, normal));
      tbn[2] = cross(tbn[0], tbn[1]);

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

      return bestT < 9999.0;
    }

    vec3 trace(inout vec4 e, inout vec4 d, inout float contrib, float sample_id)
    {
      float bestT, bestT2;
      int bestIndex, bestIndex2;
      vec4 bestMaterial, bestMaterial2;
      mat4 bestQuadric, bestQuadric2;
      vec3 lighting = vec3(0.0);

      bool wasHit = intersect(e, d, bestT, bestIndex, bestMaterial, bestQuadric);

      if (wasHit) {
        vec4 hit = e + d*bestT;
        vec3 normal = getQuadricNormal(bestQuadric, hit);
        e = hit + vec4(normal, 0.0) * 0.001;

        // calc lighting
        // for (int i = 0; i < kLightSampleCount; ++i) {
          vec3 light = PointOnLightSource(hit.xyz + vec3(0.123, 0.456, 0.891) * sample_id);
          vec3 toLight = light - hit.xyz;
          float toLightLen = length(toLight);
          vec3 toLightDir = toLight / toLightLen;
          bool inShadow = intersect(e, vec4(toLightDir, 0), bestT2, bestIndex2, bestMaterial2, bestQuadric2);
          if (!inShadow || bestT2 > toLightLen) {
            lighting += max(dot(toLightDir, normal), 0.0) * vec3(1.0);
          }
        // }

        // generate new dir
        float rand1 = rand(hit.x + normal.y + 1.513*sample_id), rand2 = rand(hit.z + normal.x + 2.901*sample_id);
        float longitude = 2.0 * kPi * rand1;
        float latitude = rand2 * kPi * 0.5;//acos(sqrt(rand2));
        vec3 cartesian = vec3(
          sin(latitude) * sin(longitude),
          cos(latitude),
          sin(latitude) * cos(longitude));
        d = vec4(cartesian * TBN(normal), 0);
      } else {
        bestMaterial.w = 0.0;
        lighting = 0.35 * d.xyz + vec3(0.15, 0.25, 0.35); // háttér
      }

      float old_contrib = contrib;
      contrib *= max(min(bestMaterial.w, 1.0), 0.0);
      float ownContrib = (old_contrib - contrib);

      return ownContrib * lighting;
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
      vec4 d = vec4(normalize(viewDirToNormalize), 0.0);
      vec4 e = vec4(eye, 1.0);

      vec3 outColor = vec3(0.0);
      for (int sample = 0; sample < kSampleCount; sample++) {
        float contrib = 1.0;
        for (int reflection = 0; reflection < kReflectionCount; reflection++) {
          outColor += trace(e, d, contrib, float(sample * kReflectionCount + reflection));
          if (contrib < 0.05)
            break;
        }
      }

      gl_FragColor = vec4(ToneMap(outColor / float(kSampleCount)), 1.0);
    }

`
;

