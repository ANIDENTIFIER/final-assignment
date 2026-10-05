const buildings = ["楠苑", "梓苑", "图书馆", "理科楼", "文科楼"];

let scene, camera, renderer, group, raycaster;
let boxes = []; // 所有方块
let hover = null; // 指向的方块
let dragging = false, lastX = 0, lastY = 0;

const height = 360; 

const loadRooms = async () => {
  try {
    const res = await fetch("data/studyrooms.json");
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }
    const data = await res.json();
    if (!data.rooms || data.rooms.length === 0) {
      $("#heat-info").text("暂无数据，无法绘制三维图");
      return;
    }
    initScene(data.rooms);
  } catch (e) {
    $("#heat-info").text("三维图加载失败");
  }
}

const getColor = (room) => {
  if (room.status !== "开放") {
    return new THREE.Color(0.6, 0.6, 0.6); 
  }
  const rate = room.occupied / room.seats;
  if (rate >= 0.85) {
    return new THREE.Color(0.9, 0.2, 0.2); 
  }
  if (rate >= 0.6) {
    return new THREE.Color(1, 0.6, 0); 
  }
  return new THREE.Color(0.2, 0.8, 0.2);
}

const initScene = (rooms) => {
  const container = document.querySelector("#heat-3d");
  const width = container.clientWidth || 600;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.95, 0.95, 0.95);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
  camera.position.set(12, 14, 52);
  camera.lookAt(0, 7, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const light = new THREE.DirectionalLight(0xffffff, 0.9);
  light.position.set(30, 50, 40);
  scene.add(light);

  group = new THREE.Group();
  group.rotation.y = -0.4; 
  scene.add(group);

  // 底部网格，方便看方位
  const grid = new THREE.GridHelper(80, 16, new THREE.Color(0.8, 0.8, 0.8), new THREE.Color(0.9, 0.9, 0.9));
  grid.position.y = 0.5;
  group.add(grid);

  // 每间自习室一个方块：x 按楼宇排，y 按楼层
  rooms.forEach((room) => {
    const idx = buildings.indexOf(room.building);
    if (idx < 0) {
      return;
    }
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 5),
      new THREE.MeshLambertMaterial({ color: getColor(room) })
    );
    box.position.set(idx * 7 - 14, room.floor * 5, 0);
    box.userData = room;
    group.add(box);
    boxes.push(box);
  });

  raycaster = new THREE.Raycaster();

  // 悬停显示房间信息
  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", resetHover);

  // 鼠标拖动旋转
  container.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) {
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    group.rotation.y += dx * 0.01;
    group.rotation.x = Math.min(0.5, Math.max(-1.2, group.rotation.x + dy * 0.005));
  });

  // 窗口大小变化时重算尺寸
  window.addEventListener("resize", () => {
    if (!renderer) {
      return;
    }
    const w = document.querySelector("#heat-3d").clientWidth;
    camera.aspect = w / height;
    camera.updateProjectionMatrix();
    renderer.setSize(w, height);
  });

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
}

const onMouseMove = (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(boxes);
  if (hits.length > 0) {
    const box = hits[0].object;
    if (hover !== box) {
      resetHover();
      hover = box;
      hover.material.emissive.setRGB(0.3, 0.3, 0.3); // 高亮一下
    }
    const room = box.userData;
    $("#heat-info").text(
      room.name + "：" + room.occupied + "/" + room.seats + " 已占用，空闲 " +
      (room.seats - room.occupied) + " 个（" + room.status + "）"
    );
  } else {
    resetHover();
  }
}

const resetHover = () => {
  if (hover) {
    hover.material.emissive.setRGB(0, 0, 0);
    hover = null;
  }
  $("#heat-info").text("按住鼠标拖动旋转，滚轮缩放，悬停方块查看详情");
}

loadRooms();
