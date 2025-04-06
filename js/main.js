// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // Even darker background for better contrast

// Create a responsive renderer setup
const setupRenderer = () => {
    const canvasContainer = document.getElementById('canvasContainer');
    if (!canvasContainer) {
        console.error('Canvas container not found!');
        return null;
    }
    
    // Get container dimensions
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight || Math.max(400, window.innerHeight * 0.6);
    
    // Create camera with proper aspect ratio
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 3;
    camera.position.x = 2;
    camera.lookAt(0, 0, 0);
    
    // Create high-quality renderer
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        precision: 'highp',
        powerPreference: 'high-performance',
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMappingExposure = 1.2; // Slightly brighter
    
    // Clear the container and add the new renderer
    while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild);
    }
    canvasContainer.appendChild(renderer.domElement);
    
    return { renderer, camera, width, height };
};

// Initialize renderer setup
let renderSetup = setupRenderer();
if (!renderSetup) {
    console.error('Failed to set up renderer');
} else {
    const { renderer, camera } = renderSetup;
    
    // Create floating data server rack concept
    const createDataCenter = () => {
        const mainGroup = new THREE.Group();
        
        // Create server rack
        const rackGeometry = new THREE.BoxGeometry(4, 5, 2);
        const rackMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.8,
            envMapIntensity: 1
        });
        const rack = new THREE.Mesh(rackGeometry, rackMaterial);
        rack.castShadow = true;
        rack.receiveShadow = true;
        mainGroup.add(rack);
        
        // Create server units
        const serverUnits = [];
        const serverCount = 8;
        for (let i = 0; i < serverCount; i++) {
            const serverGroup = new THREE.Group();
            
            // Server case
            const serverGeometry = new THREE.BoxGeometry(3.8, 0.4, 1.9);
            const serverMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                roughness: 0.5,
                metalness: 0.9
            });
            const server = new THREE.Mesh(serverGeometry, serverMaterial);
            server.castShadow = true;
            server.receiveShadow = true;
            serverGroup.add(server);
            
            // Status lights (three per server)
            const lightColors = [0x00ff00, 0x00b7eb, 0xff3300];
            const lightsGroup = new THREE.Group();
            for (let j = 0; j < 3; j++) {
                const lightGeometry = new THREE.CircleGeometry(0.05, 16);
                const lightMaterial = new THREE.MeshBasicMaterial({
                    color: lightColors[j],
                    side: THREE.DoubleSide
                });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(1.7, 0, 0.8 - j * 0.3);
                light.rotation.y = Math.PI / 2;
                lightsGroup.add(light);
            }
            serverGroup.add(lightsGroup);
            
            // Activity mesh (animated)
            const activityGeometry = new THREE.PlaneGeometry(1.6, 0.2);
            const activityMaterial = new THREE.MeshBasicMaterial({
                color: 0x00b7eb,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const activity = new THREE.Mesh(activityGeometry, activityMaterial);
            activity.position.set(0, 0, 1);
            activity.rotation.x = Math.PI / 2;
            serverGroup.add(activity);
            
            // Position the server in the rack
            serverGroup.position.y = -2.2 + i * 0.55;
            
            mainGroup.add(serverGroup);
            serverUnits.push({
                group: serverGroup,
                lights: lightsGroup.children,
                activity: activity
            });
        }
        
        // Create holographic CPU display
        const cpuHologram = createHolographicDisplay(0, 3, 2, 'CPU');
        mainGroup.add(cpuHologram.group);
        
        // Create holographic RAM display
        const ramHologram = createHolographicDisplay(-2.5, 0, 3, 'RAM');
        ramHologram.group.rotation.y = Math.PI / 4;
        mainGroup.add(ramHologram.group);
        
        // Create network connections (lines between servers)
        const networkLines = createNetworkConnections(serverUnits);
        mainGroup.add(networkLines.group);
        
        // Create floating particles system
        const particles = createParticleSystem();
        mainGroup.add(particles.system);
        
        return { 
            group: mainGroup, 
            servers: serverUnits, 
            cpuHologram,
            ramHologram,
            networkLines,
            particles
        };
    };
    
    // Create floating holographic display
    const createHolographicDisplay = (x, y, z, type) => {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Holographic cylindrical "screen"
        const holoGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 32, 1, true);
        const holoMaterial = new THREE.MeshBasicMaterial({
            color: type === 'CPU' ? 0x00b7eb : 0x00ff00,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const holo = new THREE.Mesh(holoGeometry, holoMaterial);
        holo.position.y = 1;
        group.add(holo);
        
        // Inner content - bar chart for metrics
        const barsGroup = new THREE.Group();
        const barCount = 12;
        const bars = [];
        
        for (let i = 0; i < barCount; i++) {
            const barGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
            const barMaterial = new THREE.MeshBasicMaterial({
                color: type === 'CPU' ? 0x00b7eb : 0x00ff00,
                transparent: true,
                opacity: 0.7
            });
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            
            const angle = (i / barCount) * Math.PI * 2;
            bar.position.x = Math.sin(angle) * 0.4;
            bar.position.z = Math.cos(angle) * 0.4;
            bar.position.y = 0.5;
            bar.scale.y = 0.2 + Math.random() * 0.8;
            
            barsGroup.add(bar);
            bars.push(bar);
        }
        
        barsGroup.position.y = 1;
        group.add(barsGroup);
        
        // Text label
        const fontParams = {
            font: 'Arial',
            size: 0.2,
            height: 0.02
        };
        
        const textGeometry = new THREE.TextGeometry(type, fontParams);
        const textMaterial = new THREE.MeshBasicMaterial({
            color: type === 'CPU' ? 0x00b7eb : 0x00ff00
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(-0.2, 2.2, 0);
        group.add(textMesh);
        
        // Value display
        const valueGeometry = new THREE.TextGeometry('0%', fontParams);
        const valueMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const valueMesh = new THREE.Mesh(valueGeometry, valueMaterial);
        valueMesh.position.set(-0.1, 0.2, 0);
        group.add(valueMesh);
        
        return {
            group,
            bars,
            holo,
            valueMesh,
            update: (value) => {
                // Update bars based on value
                bars.forEach((bar, i) => {
                    const intensity = value / 100;
                    // Create waveform effect
                    const height = 0.2 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.3 + intensity * 0.8;
                    bar.scale.y = height;
                    
                    // Color shift based on value
                    if (type === 'CPU') {
                        const color = new THREE.Color().setHSL(0.6 - (intensity * 0.6), 1, 0.5);
                        bar.material.color = color;
                    } else {
                        const color = new THREE.Color().setHSL(0.3 - (intensity * 0.3), 1, 0.5);
                        bar.material.color = color;
                    }
                    
                    // Opacity based on value
                    bar.material.opacity = 0.4 + intensity * 0.6;
                });
                
                // Update holo cylinder color
                const color = type === 'CPU' ? 
                    new THREE.Color().setHSL(0.6 - (value/100 * 0.6), 1, 0.5) :
                    new THREE.Color().setHSL(0.3 - (value/100 * 0.3), 1, 0.5);
                holo.material.color = color;
                
                // Pulse effect based on value
                const pulseIntensity = value / 100;
                const pulse = 0.1 + 0.1 * Math.sin(Date.now() * 0.003) * pulseIntensity;
                holo.material.opacity = 0.1 + pulse;
                
                // Update value text
                valueMesh.geometry.dispose();
                valueMesh.geometry = new THREE.TextGeometry(`${value.toFixed(1)}%`, fontParams);
            }
        };
    };
    
    // Create network connections between servers
    const createNetworkConnections = (servers) => {
        const group = new THREE.Group();
        const lines = [];
        
        // Prepare line materials
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00b7eb, 
            transparent: true,
            opacity: 0.5
        });
        
        // Create connections between adjacent servers
        for (let i = 0; i < servers.length - 1; i++) {
            const points = [];
            const server1 = servers[i].group.position;
            const server2 = servers[i + 1].group.position;
            
            // Create bezier curve points
            points.push(new THREE.Vector3(server1.x - 1, server1.y, server1.z));
            points.push(new THREE.Vector3(server1.x - 1.5, (server1.y + server2.y) / 2, server1.z + 0.5));
            points.push(new THREE.Vector3(server2.x - 1, server2.y, server2.z));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            group.add(line);
            lines.push(line);
        }
        
        return {
            group,
            lines,
            update: (dataFlow) => {
                lines.forEach((line, i) => {
                    // Change color intensity based on data flow
                    const hue = 0.6 - (dataFlow / 100) * 0.6;
                    const color = new THREE.Color().setHSL(hue, 1, 0.5);
                    line.material.color = color;
                    
                    // Pulse opacity based on data flow
                    const baseOpacity = 0.3 + (dataFlow / 100) * 0.7;
                    line.material.opacity = baseOpacity * (0.7 + 0.3 * Math.sin(Date.now() * 0.005 + i * 0.2));
                });
            }
        };
    };
    
    // Create particle system for ambient data flow visualization
    const createParticleSystem = () => {
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Position particles in a cloud around the server rack
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;
            
            // Color ranges from blue to cyan
            color.setHSL(0.5 + Math.random() * 0.1, 1.0, 0.5 + Math.random() * 0.3);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random sizes
            sizes[i] = Math.random() * 0.1;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(geometry, material);
        
        return {
            system: particles,
            update: (activity) => {
                const positions = particles.geometry.attributes.position.array;
                const sizes = particles.geometry.attributes.size.array;
                const colors = particles.geometry.attributes.color.array;
                
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    
                    // Move particles based on activity level
                    positions[i3 + 1] -= (0.01 + activity * 0.0003) * (sizes[i] * 10);
                    
                    // Reset particles that go too far down
                    if (positions[i3 + 1] < -5) {
                        positions[i3] = (Math.random() - 0.5) * 10;
                        positions[i3 + 1] = 5;
                        positions[i3 + 2] = (Math.random() - 0.5) * 10;
                        
                        // Change color based on activity
                        const hue = 0.5 + (activity / 100) * 0.3;
                        color.setHSL(hue, 1.0, 0.5);
                        colors[i3] = color.r;
                        colors[i3 + 1] = color.g;
                        colors[i3 + 2] = color.b;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
                particles.geometry.attributes.color.needsUpdate = true;
            }
        };
    };
    
    // Add proper lighting for 3D effect
    const addLighting = () => {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
        scene.add(ambientLight);
        
        // Main directional light with shadows
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 8, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        scene.add(mainLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x9999ff, 0.3);
        fillLight.position.set(-5, 0, -10);
        scene.add(fillLight);
        
        // Add spotlights for dramatic effect
        const spotLight1 = new THREE.SpotLight(0x00b7eb, 1, 20, Math.PI / 6, 0.5);
        spotLight1.position.set(0, 10, 0);
        spotLight1.castShadow = true;
        scene.add(spotLight1);
        
        const spotLight2 = new THREE.SpotLight(0x00ff00, 0.8, 15, Math.PI / 6, 0.5);
        spotLight2.position.set(-8, 5, 5);
        scene.add(spotLight2);
        
        // Add fog for depth
        scene.fog = new THREE.FogExp2(0x000000, 0.03);
        
        return { spotLight1, spotLight2 };
    };
    
    // Create the data center
    const dataCenter = createDataCenter();
    scene.add(dataCenter.group);
    
    // Add lighting
    const lights = addLighting();
    
    // Set initial camera position and orbit controls
    camera.position.set(8, 5, 12);
    camera.lookAt(dataCenter.group.position);
    
    // Function to update the visualization based on metrics
    function updateVisualization(cpu, ram) {
        // Update CPU hologram
        dataCenter.cpuHologram.update(cpu);
        
        // Update RAM hologram
        dataCenter.ramHologram.update(ram);
        
        // Update server lights based on CPU activity
        dataCenter.servers.forEach((server, i) => {
            // Distribute the CPU load across servers
            const serverLoad = Math.max(0, Math.min(100, cpu - (5 * i)));
            
            // Update status lights
            server.lights[0].material.opacity = serverLoad > 30 ? 1 : 0.3;
            server.lights[1].material.opacity = serverLoad > 60 ? 1 : 0.3;
            server.lights[2].material.opacity = serverLoad > 85 ? 1 : 0.3;
            
            // Update activity display
            server.activity.scale.x = 0.1 + (serverLoad / 100) * 0.9;
            
            // Color shift based on load
            const hue = 0.6 - (serverLoad / 100) * 0.6;
            server.activity.material.color.setHSL(hue, 1, 0.5);
        });
        
        // Update network connections
        dataCenter.networkLines.update((cpu + ram) / 2);
        
        // Update particle system
        dataCenter.particles.update((cpu + ram) / 2);
        
        // Make the data center slowly rotate
        dataCenter.group.rotation.y += 0.002;
        
        // Animate spotlights for dramatic effect
        const time = Date.now() * 0.001;
        lights.spotLight1.position.x = Math.sin(time * 0.3) * 8;
        lights.spotLight1.position.z = Math.cos(time * 0.3) * 8;
        lights.spotLight2.position.x = Math.sin(time * 0.4 + 2) * 8;
        lights.spotLight2.position.z = Math.cos(time * 0.4 + 2) * 8;
    }
    
    // Fetch metrics function remains mostly unchanged
    async function fetchMetrics() {
        try {
            const response = await fetch(window.location.origin + '/metrics');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Update dashboard
            document.getElementById('cpuUsage').textContent = `${data.cpu.toFixed(1)}%`;
            document.getElementById('ramUsage').textContent = `${data.ram.toFixed(1)}%`;
            
            // Update the 3D visualization
            updateVisualization(data.cpu, data.ram);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            // Use dummy data for testing if fetch fails
            updateVisualization(
                30 + Math.sin(Date.now() * 0.001) * 30, // CPU oscillates between 0-60%
                40 + Math.sin(Date.now() * 0.0005) * 30 // RAM oscillates between 10-70%
            );
        }
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    function handleResize() {
        renderSetup = setupRenderer();
        if (renderSetup) {
            const { renderer, camera } = renderSetup;
            // Reset camera position
            camera.position.set(8, 5, 12);
            camera.lookAt(dataCenter.group.position);
            animate(); // Restart animation with new renderer
        }
    }
    
    // Set up resize handling with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
    
    // Fetch metrics every second
    setInterval(fetchMetrics, 1000);
    
    // Start the animation
    animate();
}