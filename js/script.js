import * as THREE from '../vendor/three.js-master/build/three.module.js';
import Stats from '../vendor/three.js-master/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../vendor/three.js-master/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from '../vendor/three.js-master/examples/jsm/loaders/FBXLoader.js';

const Scene = {
	vars: {
		container: null,
		scene: null,
		renderer: null,
		camera: null,
		stats: null,
		controls: null,
		texture: null,
		mouse: new THREE.Vector2(),
		raycaster: new THREE.Raycaster(),
		animSpeed: null,
		animPercent: 0.00,
		currentClonable: null,
		currentClonableIndex: 0,
		clonables: [],
	},
	animate: () => {
		requestAnimationFrame(Scene.animate);
		Scene.vars.raycaster.setFromCamera(Scene.vars.mouse, Scene.vars.camera);

		Scene.customAnimation();

		if (Scene.vars.platform !== undefined) {
			let intersects = Scene.vars.raycaster.intersectObjects(Scene.vars.platform.children, true);

			if (intersects.length > 0) {
				Scene.vars.animSpeed = 0.05;
			} else {
				Scene.vars.animSpeed = -0.05;
			}
		}

		Scene.render();
	},
	render: () => {
		Scene.vars.renderer.render(Scene.vars.scene, Scene.vars.camera);
		Scene.vars.stats.update();
	},
	customAnimation: () => {
		let vars = Scene.vars;

		if (vars.animSpeed === null) {
			return;
		}

		vars.animPercent += vars.animSpeed;	

		if (vars.animPercent < 0) {
			vars.animPercent = 0;
		}
		if (vars.animPercent > 1) {
			vars.animPercent = 1;
		}

		if (vars.animPercent > 0 && vars.animPercent < 1) {
			Scene.vars.platform.position.y = vars.animPercent * 50;
		} else if (vars.animPercent >= 1) {
			Scene.vars.platform.position.y = 50;
		} else if (vars.animPercent <= 0) {
			Scene.vars.platform.position.y = 0;
		}
	},
	loadFBX: (file, scale, position, rotation, color, namespace, clonable, callback) => {
		let loader = new FBXLoader();

		if (file === undefined) {
			return;
		}

		loader.load('./fbx/' + file, (object) => {

			object.traverse((child) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					child.material.color = new THREE.Color(color);
				}
			});

			object.position.set(position[0], position[1], position[2]);
			object.rotation.set(rotation[0], rotation[1], rotation[2]);
			object.scale.set(scale, scale, scale);
			object.name = namespace;

			Scene.vars[namespace] = object;

			if(clonable) {
				Scene.vars.clonables.push(object);
			}
			callback();
		});
	},
	onWindowResize: () => {
		let vars = Scene.vars;
		vars.camera.aspect = window.innerWidth / window.innerHeight;
		vars.camera.updateProjectionMatrix();
		vars.renderer.setSize(window.innerWidth, window.innerHeight);
	},
	onKeyPress: (event) => {
		if(event.code === "Space") {
			let vars = Scene.vars;
			vars.currentClonableIndex++;
			if(vars.currentClonableIndex + 1 > vars.clonables.length) {
				vars.currentClonableIndex = 0;
			}
			vars.currentClonable = vars.clonables[vars.currentClonableIndex];
			console.log(vars.currentClonable);
			alert("Selected item : " + vars.currentClonable.name);
		}
	},
	onMouseMove: (event) => {
		Scene.vars.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		Scene.vars.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	},
	onMouseClick: (event) => {
		if (Scene.vars.platform !== undefined) {
			let intersects = Scene.vars.raycaster.intersectObjects([Scene.vars.ground], false);

			if (intersects.length > 0) {
				let coord = intersects[0].point;

				console.log(Scene.vars.currentClonable.name + " at : " + coord.x + "/" + coord.y + "/" + coord.z);

				let flower01Clone = Scene.vars.currentClonable.clone();
				flower01Clone.position.set(coord.x, coord.y, coord.z);
				Scene.vars.scene.add(flower01Clone);
			}
		}
	},
	degresToRadian: (degres) => {
		return degres * PI / 180
	},
	getRandomInt: (max) => {
		return Math.floor(Math.random() * Math.floor(max));
	},
	init: () => {
		let vars = Scene.vars;

		// Préparer le container pour la scène
		vars.container = document.createElement('div');
		vars.container.classList.add('fullscreen');
		document.body.appendChild(vars.container);

		// ajout de la scène
		vars.scene = new THREE.Scene();
		vars.scene.background = new THREE.Color(0xa0a0a0);
		vars.scene.fog = new THREE.Fog(vars.scene.background, 500, 3000);

		// paramétrage du moteur de rendu
		vars.renderer = new THREE.WebGLRenderer({ antialias: true });
		vars.renderer.setPixelRatio(window.devicePixelRatio);
		vars.renderer.setSize(window.innerWidth, window.innerHeight);

		vars.renderer.shadowMap.enabled = true;
		vars.renderer.shadowMapSoft = true;

		vars.container.appendChild(vars.renderer.domElement);

		// ajout de la caméra
		vars.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
		vars.camera.position.set(-1.5, 210, 572);

		// ajout de la lumière
		const lightIntensityHemisphere = .5;
		let light = new THREE.HemisphereLight(0xFFFFFF, 0x444444, lightIntensityHemisphere);
		light.position.set(0, 700, 0);
		vars.scene.add(light);

		// ajout des directionelles
		const lightIntensity = .8;
		const d = 1000;
		let light1 = new THREE.DirectionalLight(0xFFFFFF, lightIntensity);
		light1.position.set(0, 700, 0);
		light1.castShadow = true;
		light1.shadow.camera.left = -d;
		light1.shadow.camera.right = d;
		light1.shadow.camera.top = d;
		light1.shadow.camera.bottom = -d;
		light1.shadow.camera.far = 5000;
		light1.shadow.mapSize.width = 4096;
		light1.shadow.mapSize.height = 4096;
		vars.scene.add(light1);
		// let helper = new THREE.DirectionalLightHelper(light1, 5);
		// vars.scene.add(helper);

		let light2 = new THREE.DirectionalLight(0xFFFFFF, lightIntensity);
		light2.position.set(-400, 200, 400);
		light2.castShadow = true;
		light2.shadow.camera.left = -d;
		light2.shadow.camera.right = d;
		light2.shadow.camera.top = d;
		light2.shadow.camera.bottom = -d;
		light2.shadow.camera.far = 5000;
		light2.shadow.mapSize.width = 4096;
		light2.shadow.mapSize.height = 4096;
		vars.scene.add(light2);
		// let helper2 = new THREE.DirectionalLightHelper(light2, 5);
		// vars.scene.add(helper2);

		// ajout du sol
		let ground = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			new THREE.MeshLambertMaterial(
				{ color: new THREE.Color(0x709B40) }
			)
		);
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = false;
		vars.scene.add(ground);
		vars.ground = ground;

		let planeMaterial = new THREE.ShadowMaterial();
		planeMaterial.opacity = 0.07;
		let shadowPlane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2000, 2000),
			planeMaterial);
		shadowPlane.rotation.x = -Math.PI / 2;
		shadowPlane.receiveShadow = true;

		vars.scene.add(shadowPlane);

		// ajout de la texture helper du sol
		// let grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
		// grid.material.opacity = 0.2;
		// grid.material.transparent = true;
		// vars.scene.add(grid);

		vars.texture = new THREE.TextureLoader().load('./texture/marbre.jpg');

		let hash = document.location.hash.substr(1);
		if (hash.length !== 0) {
			let text = hash.substring();
			Scene.vars.text = decodeURI(text);
		}

		Scene.loadFBX("flower01.fbx", 1, [50, 0, 300], [0, 0, 0], 0xC4151C, 'flower01', true, () => {
			Scene.loadFBX("rock01.fbx", 1, [-320, 0, 50], [0, 0, 0], 0x888C8D, 'rock01', true, () => {
				Scene.loadFBX("tree01.fbx", 1, [0, 0, 0], [0, 0, 0], 0x755F44, 'tree01', true, () => {

					let vars = Scene.vars;

					let platform = new THREE.Group();
					platform.add(vars.flower01);
					platform.add(vars.rock01);
					platform.add(vars.tree01);
					vars.scene.add(platform);
					vars.platform = platform;

					vars.currentClonable = vars.flower01;

					let elem = document.querySelector('#loading');
					elem.parentNode.removeChild(elem);
				});
			});
		});



		// ajout des controles
		vars.controls = new OrbitControls(vars.camera, vars.renderer.domElement);
		vars.controls.minDistance = 300;
		//vars.controls.maxDistance = 600;
		vars.controls.minPolarAngle = Math.PI / 4;
		vars.controls.maxPolarAngle = Math.PI / 2;
		vars.controls.target.set(0, 100, 0);
		vars.controls.update();

		window.addEventListener('resize', Scene.onWindowResize, false);
		window.addEventListener('mousemove', Scene.onMouseMove, false);
		window.addEventListener('mousedown', Scene.onMouseClick, false);
		window.addEventListener('keypress', Scene.onKeyPress, false);

		vars.stats = new Stats();
		vars.container.appendChild(vars.stats.dom);

		vars.camera.far = 5000;
		Scene.animate();
	}
};

Scene.init();