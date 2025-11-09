// 게임 상태
let scene, camera, renderer;
let playerHamster, computerHamster, vine;
let gameActive = false;
let playerVine = 50; // 플레이어가 먹은 덩굴 양
let computerVine = 50; // 컴퓨터가 먹은 덩굴 양
let spacePressed = false;
let spaceCount = 0;
let animationId;

// 게임 설정
const GAME_SETTINGS = {
    playerSpeed: 1.5, // 스페이스바 한 번당 먹는 양
    computerSpeed: 0.05, // 프레임당 컴퓨터가 먹는 양
    totalVine: 100, // 총 덩굴 길이
    vineLength: 10
};

// 초기화
function init() {
    // Three.js 씬 설정
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

    // 카메라 설정
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);

    // 렌더러 설정
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 바닥
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 햄스터와 덩굴 생성
    createGameObjects();

    // 윈도우 리사이즈 핸들러
    window.addEventListener('resize', onWindowResize);

    // 이벤트 리스너
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

// 게임 오브젝트 생성
function createGameObjects() {
    // 플레이어 햄스터 (왼쪽 - 파란색)
    const playerGroup = new THREE.Group();

    // 몸통
    const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4facfe });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    playerGroup.add(body);

    // 귀 (왼쪽)
    const earGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0x3d8fd1 });
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.4, 0.6, 0.2);
    playerGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.4, 0.6, 0.2);
    playerGroup.add(rightEar);

    // 눈
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.3, 0.7);
    playerGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.3, 0.7);
    playerGroup.add(rightEye);

    // 코
    const noseGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.1, 0.8);
    playerGroup.add(nose);

    playerGroup.position.set(-5, 1, 0);
    playerHamster = playerGroup;
    scene.add(playerHamster);

    // 컴퓨터 햄스터 (오른쪽 - 주황색)
    const computerGroup = new THREE.Group();

    const computerBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const computerBody = new THREE.Mesh(bodyGeometry, computerBodyMaterial);
    computerBody.castShadow = true;
    computerGroup.add(computerBody);

    const computerEarMaterial = new THREE.MeshStandardMaterial({ color: 0xcc8400 });
    const computerLeftEar = new THREE.Mesh(earGeometry, computerEarMaterial);
    computerLeftEar.position.set(-0.4, 0.6, 0.2);
    computerGroup.add(computerLeftEar);

    const computerRightEar = new THREE.Mesh(earGeometry, computerEarMaterial);
    computerRightEar.position.set(0.4, 0.6, 0.2);
    computerGroup.add(computerRightEar);

    const computerLeftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    computerLeftEye.position.set(-0.3, 0.3, 0.7);
    computerGroup.add(computerLeftEye);

    const computerRightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    computerRightEye.position.set(0.3, 0.3, 0.7);
    computerGroup.add(computerRightEye);

    const computerNose = new THREE.Mesh(noseGeometry, noseMaterial);
    computerNose.position.set(0, 0.1, 0.8);
    computerGroup.add(computerNose);

    computerGroup.position.set(5, 1, 0);
    computerGroup.rotation.y = Math.PI; // 반대 방향을 보도록
    computerHamster = computerGroup;
    scene.add(computerHamster);

    // 덩굴 (가운데)
    const vineGroup = new THREE.Group();

    // 덩굴 줄기
    const vineSegments = 20;
    const vineGeometry = new THREE.CylinderGeometry(0.1, 0.1, GAME_SETTINGS.vineLength, 8);
    const vineMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const vineStem = new THREE.Mesh(vineGeometry, vineMaterial);
    vineStem.rotation.z = Math.PI / 2;
    vineGroup.add(vineStem);

    // 덩굴 잎사귀들
    for (let i = 0; i < 10; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        leaf.scale.set(1, 0.5, 0.3);
        const position = (Math.random() - 0.5) * GAME_SETTINGS.vineLength;
        leaf.position.set(position, Math.sin(i) * 0.3, Math.cos(i) * 0.3);
        vineGroup.add(leaf);
    }

    vineGroup.position.set(0, 1, 0);
    vine = vineGroup;
    scene.add(vine);
}

// 게임 시작
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    gameActive = true;
    playerVine = 50;
    computerVine = 50;
    spaceCount = 0;

    updateHUD();
    animate();
}

// 게임 재시작
function restartGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    gameActive = true;
    playerVine = 50;
    computerVine = 50;
    spaceCount = 0;

    // 햄스터 위치 초기화
    playerHamster.position.x = -5;
    computerHamster.position.x = 5;
    vine.position.x = 0;

    updateHUD();
    animate();
}

// 키 입력 처리
function onKeyDown(event) {
    if (event.code === 'Space' && gameActive && !spacePressed) {
        spacePressed = true;
        spaceCount++;

        // 컴퓨터의 덩굴을 빼앗아서 플레이어에게 추가
        const eatAmount = Math.min(GAME_SETTINGS.playerSpeed, computerVine);
        computerVine -= eatAmount;
        playerVine += eatAmount;

        // 햄스터 애니메이션 (입 벌리기)
        playerHamster.scale.set(1.1, 0.9, 1);

        updateHUD();
    }
}

function onKeyUp(event) {
    if (event.code === 'Space') {
        spacePressed = false;
        // 햄스터 원래대로
        playerHamster.scale.set(1, 1, 1);
    }
}

// 컴퓨터 AI
function updateComputer() {
    if (!gameActive) return;

    // 컴퓨터가 플레이어의 덩굴을 빼앗아서 자신에게 추가
    const eatAmount = Math.min(GAME_SETTINGS.computerSpeed, playerVine);
    playerVine -= eatAmount;
    computerVine += eatAmount;

    // 랜덤하게 먹는 애니메이션
    if (Math.random() > 0.7) {
        computerHamster.scale.set(1.1, 0.9, 1);
        setTimeout(() => {
            computerHamster.scale.set(1, 1, 1);
        }, 100);
    }
}

// 줄다리기 로직 업데이트
function updateTugOfWar() {
    if (!gameActive) return;

    // 덩굴 비율로 위치 계산 (-1 ~ 1)
    const vineRatio = (playerVine - computerVine) / GAME_SETTINGS.totalVine;

    // 덩굴 위치 업데이트 (왼쪽 -5 ~ 오른쪽 5)
    vine.position.x = vineRatio * 5;

    // 햄스터들 위치 업데이트 (덩굴 따라가기)
    playerHamster.position.x = vine.position.x - 3;
    computerHamster.position.x = vine.position.x + 3;

    // 승리 조건 체크 (한쪽이 덩굴을 95% 이상 차지하면 승리)
    if (playerVine >= 95) {
        endGame(true);
    } else if (computerVine >= 95) {
        endGame(false);
    }
}

// HUD 업데이트
function updateHUD() {
    const playerProgress = (playerVine / GAME_SETTINGS.totalVine) * 100;
    const computerProgress = (computerVine / GAME_SETTINGS.totalVine) * 100;

    document.getElementById('player-progress').style.width = playerProgress + '%';
    document.getElementById('computer-progress').style.width = computerProgress + '%';
    document.getElementById('space-counter').textContent = '스페이스바: ' + spaceCount;

    // 중앙 인디케이터 위치 (-1 ~ 1 범위로 정규화)
    const vineRatio = (playerVine - computerVine) / GAME_SETTINGS.totalVine;
    const indicatorPosition = vineRatio * 200; // -200 ~ 200 픽셀 범위
    document.getElementById('tug-indicator').style.transform = `translateX(${indicatorPosition}px)`;
}

// 게임 종료
function endGame(playerWon) {
    gameActive = false;
    cancelAnimationFrame(animationId);

    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'flex';

    if (playerWon) {
        document.getElementById('result-text').textContent = '🎉 승리! 🎉';
        document.getElementById('result-message').textContent = `축하합니다! ${spaceCount}번 눌러서 이겼어요!`;
    } else {
        document.getElementById('result-text').textContent = '😢 패배 😢';
        document.getElementById('result-message').textContent = `아쉽게 졌어요. 더 빨리 눌러보세요!`;
    }
}

// 애니메이션 루프
function animate() {
    if (!gameActive) return;

    animationId = requestAnimationFrame(animate);

    updateComputer();
    updateTugOfWar();
    updateHUD();

    // 덩굴 회전 애니메이션
    vine.rotation.y += 0.01;

    // 햄스터 살짝 위아래로 움직이기 (호흡 효과)
    const time = Date.now() * 0.001;
    playerHamster.position.y = 1 + Math.sin(time * 2) * 0.1;
    computerHamster.position.y = 1 + Math.sin(time * 2 + Math.PI) * 0.1;

    renderer.render(scene, camera);
}

// 윈도우 리사이즈
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 게임 초기화 실행
init();
