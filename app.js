const state = { data: null };

const loadData = async () => {
    $('#status').text("加载中...").show();
    try {
        const [response, response2] = await Promise.all([fetch("data\\studyrooms.json"), fetch("data\\studyrooms copy.json")]);
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        if (!response2.ok) {
            throw new Error("HTTP " + response2.status);
        }
        const [raw_data, raw_data2] = await Promise.all([response.json(), response2.json()])
        if (raw_data.rooms.length === 0 && raw_data2.rooms.length === 0) {
            $("#status").text("暂无数据").show();
            return;
        }

        state.data = {
            buildings: ["楠苑", "梓苑", "图书馆", "理科楼", "文科楼"],
            series: {
                available: [0, 0, 0, 0, 0],
                occupied: [0, 0, 0, 0, 0],
                unavailable: [0, 0, 0, 0, 0],
            }
        };
        raw_data.rooms.forEach(room => {
            if (room.status === "开放") {
                state.data.series.available[state.data.buildings.indexOf(room.building)] += room.seats - room.occupied;
                state.data.series.occupied[state.data.buildings.indexOf(room.building)] += room.occupied;
            } else {
                state.data.series.unavailable[state.data.buildings.indexOf(room.building)] += room.seats;
            }
        });
        raw_data2.rooms.forEach(room => {
            if (room.status === "开放") {
                state.data.series.available[state.data.buildings.indexOf(room.building)] += room.seats - room.occupied;
                state.data.series.occupied[state.data.buildings.indexOf(room.building)] += room.occupied;
            } else {
                state.data.series.unavailable[state.data.buildings.indexOf(room.building)] += room.seats;
            }
        });

        $("#sub-title").text(raw_data.title + " · 数据来源：课程统一数据集（教学演示数据，非真实统计）");
        $("#status").hide();
        renderCards(state.data);
        renderBarChart(state.data);
        renderPieChart(state.data);
    } catch (error) {
        $("#status")
            .text("加载失败：" + error.message)
            .show();
    }
}

const renderCards = (data) => {
    [0, 1, 2, 3, 4].forEach(idx => {
        $("#cards").append(`
        <div class="col-md-4">
            <div class="card">
            <div class="card-body">
                <h3 class="card-title h6">${data.buildings[idx]}</h3>
                <p class="card-text fs-4">${data.series.occupied[idx]} / ${data.series.occupied[idx] + data.series.available[idx]}</p>
                <p class="card-text small text-muted">已使用 / 座位总数</p>
            </div>
            </div>
        </div>
        `);
    });
};

let barChart = null;

const renderBarChart = (data) => {
    if (barChart === null) {
        barChart = echarts.init(document.querySelector("#bar-chart"));
    }

    const i18n = {
        "available": "可用",
        "occupied": "占用中",
        "unavailable": "禁止使用",
    };

    barChart.setOption({
        title: { text: "各图书馆座位使用情况", left: "center" },
        tooltip: { trigger: "axis" },
        legend: { bottom: 0 },
        xAxis: { data: data.buildings },
        yAxis: { name: "个" },
        series: Object.entries(data.series).map(([key, value]) => ({
            name: i18n[key],
            type: "bar",
            data: value,
        })),
    });
};

let pieChart = null;

const renderPieChart = (data) => {
    if (pieChart !== null) {
        pieChart.destroy(); // 防重复初始化
    }
    const ctx = document.querySelector("#pie-chart");
    pieChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["可用", "已占用", "暂停使用"],
            datasets: [
                {
                    data: [
                        data.series.available.reduce((sum, n) => sum + n, 0),
                        data.series.occupied.reduce((sum, n) => sum + n, 0),
                        data.series.unavailable.reduce((sum, n) => sum + n, 0),
                    ],
                    backgroundColor: [
                        "#5470C6", // 绿色：可用
                        "#FAC858", // 蓝色：占用
                        "#6c757d", // 灰色：暂停使用
                    ],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: "图书馆座位使用情况" },
            },
        },
    });
};

window.addEventListener("resize", () => {
    if (barChart) barChart.resize();
    // Chart.js响应式默认自动处理，无需手动
});

$('#cards').on('click', '.card', function () {
    $(this).toggleClass('border-primary shadow');
});

loadData();