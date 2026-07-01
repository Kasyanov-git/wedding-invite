/**
 * Фоновый эффект «развевающейся ткани» на WebGL (Three.js).
 * Если WebGL недоступен, JS добавляет body класс .no-webgl, и показывается CSS-fallback.
 */

(function () {
    const canvas = document.getElementById('fabric-canvas');
    if (!canvas) return;

    // Проверка WebGL
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !window.THREE) {
        document.body.classList.add('no-webgl');
        return;
    }

    let scene, camera, renderer, material, mesh;
    let animationId;
    let isVisible = true;

    // Настройки: плотность сетки, скорость, цвета
    const config = {
        segmentsX: 48,
        segmentsY: 32,
        speed: 0.35,
        waveScale: 0.18,
        primaryColor: new THREE.Color('#E6C8B3'),    // nude
        secondaryColor: new THREE.Color('#F7E7CE'), // champagne
        shadowColor: new THREE.Color('#D4B896'),      // beige
        highlightColor: new THREE.Color('#FBF7F1'),   // cream
    };

    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
        config.segmentsX = 32;
        config.segmentsY = 24;
        config.speed = 0.25;
    }

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'low-power'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

        const geometry = new THREE.PlaneGeometry(10, 7, config.segmentsX, config.segmentsY);

        const vertexShader = `
            varying vec2 vUv;
            varying float vElevation;
            uniform float uTime;
            uniform float uWaveScale;

            // Простая функция шума для органичности
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            void main() {
                vUv = uv;
                vec3 pos = position;

                float wave1 = sin(pos.x * 1.8 + uTime * 1.2) * 0.5;
                float wave2 = sin(pos.y * 2.4 + uTime * 0.8) * 0.35;
                float wave3 = sin((pos.x + pos.y) * 1.2 + uTime * 0.6) * 0.25;
                float wave4 = sin(pos.x * 3.5 - uTime * 1.5) * 0.15;

                float elevation = (wave1 + wave2 + wave3 + wave4) * uWaveScale;
                pos.z += elevation;

                vElevation = elevation;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            varying float vElevation;
            uniform vec3 uPrimary;
            uniform vec3 uSecondary;
            uniform vec3 uShadow;
            uniform vec3 uHighlight;

            void main() {
                // Основной градиент по диагонали
                vec3 baseColor = mix(uPrimary, uSecondary, vUv.x * 0.7 + vUv.y * 0.3);
                baseColor = mix(baseColor, uHighlight, 0.25 + vUv.y * 0.2);

                // Тени и блики в складках
                float shadow = smoothstep(-0.15, 0.15, vElevation);
                vec3 color = mix(uShadow, baseColor, shadow);
                color = mix(color, uHighlight, smoothstep(0.05, 0.18, vElevation) * 0.35);

                // Лёгкий блик по краям
                float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x)
                               * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
                color = mix(color, uHighlight, (1.0 - edgeFade) * 0.1);

                gl_FragColor = vec4(color, 0.92);
            }
        `;

        material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uWaveScale: { value: config.waveScale },
                uPrimary: { value: config.primaryColor },
                uSecondary: { value: config.secondaryColor },
                uShadow: { value: config.shadowColor },
                uHighlight: { value: config.highlightColor },
            },
            transparent: true,
            side: THREE.DoubleSide,
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        window.addEventListener('resize', onResize, { passive: true });
        document.addEventListener('visibilitychange', onVisibilityChange);

        animate();
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onVisibilityChange() {
        isVisible = !document.hidden;
        if (isVisible && !animationId) {
            animate();
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!isVisible) {
            animationId = null;
            return;
        }

        material.uniforms.uTime.value += 0.01 * config.speed;

        // Лёгкое вращение плоскости для ощущения движения ткани
        mesh.rotation.z = Math.sin(material.uniforms.uTime.value * 0.3) * 0.02;
        mesh.rotation.x = Math.sin(material.uniforms.uTime.value * 0.2) * 0.015;

        renderer.render(scene, camera);
    }

    try {
        init();
    } catch (e) {
        console.warn('WebGL fabric failed:', e);
        document.body.classList.add('no-webgl');
        if (renderer) renderer.dispose();
    }
})();
