const listState = {
  rooms: [],
  building: "", 
  status: "",   
  name: "",  
  sortByFree: false,
};

const loadListData = async () => {
  $("#status").text("加载中...").show();
  try {
    const res = await fetch("data/studyrooms.json");
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }
    const data = await res.json();
    listState.rooms = data.rooms || [];
    if (listState.rooms.length === 0) {
      $("#status").text("暂无数据").show();
      return;
    }
    $("#status").hide();
    

    // 下拉框
    const buildings = [...new Set(listState.rooms.map(r => r.building))];
    buildings.forEach(b => {
      $("#building-select").append(`<option value="${b}">${b}</option>`);
    });
    renderList();
  } catch (e) {
    $("#status").text("加载失败：" + e.message).show();
  }
};

const getFilteredRooms = () => {
  let list = listState.rooms.filter(room => {
    if (listState.building && room.building !== listState.building) {
      return false;
    }
    if (listState.status && room.status !== listState.status) {
      return false;
    }
    if (listState.name && !room.name.includes(listState.name)) {
      return false;
    }
    return true;
  });
  if (listState.sortByFree) {
    list = list.sort((a, b) => (b.seats - b.occupied) - (a.seats - a.occupied));
  }
  return list;
};

const statusBgColor = status => {
  if (status === "开放") {
    return "text-bg-success";
  }
  if (status === "维修") {
    return "text-bg-warning";
  }
  return "text-bg-secondary";
};

const renderList = () => {
  const list = getFilteredRooms();
  $("#empty-tip").toggleClass("d-none", list.length > 0);
  $("#room-list").html(
    list.map(room => `
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h3 class="card-title h6">${room.name}</h3>
            <p class="card-text small text-muted mb-1">${room.building} ${room.floor}层 · ${room.hours}</p>
            <p class="card-text fs-5 mb-1">${room.occupied} / ${room.seats}</p>
            <p class="card-text small text-muted mb-2">已占用 / 座位总数 · 空闲 ${room.seats - room.occupied}</p>
            <span class="badge ${statusBgColor(room.status)}">${room.status}</span>
          </div>
        </div>
      </div>
    `).join("")
  );
};

$("#building-select").on("change", function () {
  listState.building = this.value;
  renderList();
});

$("#status-group button").on("click", function () {
  $("#status-group button").removeClass("active");
  $(this).addClass("active");
  listState.status = $(this).data("status");
  renderList();
});

$("#search-input").on("input", function () {
  listState.name = this.value.trim();
  renderList();
});

$("#sort-btn").on("click", function () {
  listState.sortByFree = !listState.sortByFree;
  $(this).text(listState.sortByFree ? "恢复默认顺序" : "按空闲座位数排序");
  renderList();
});

loadListData();
