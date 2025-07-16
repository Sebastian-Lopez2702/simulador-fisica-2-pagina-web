document.addEventListener("DOMContentLoaded", () => {
  const voltageInput = document.getElementById("voltage");
  const resistanceInput = document.getElementById("resistance");
  const configSelect = document.getElementById("config");
  const addCapacitorBtn = document.getElementById("add-capacitor");
  const removeCapacitorBtn = document.getElementById("remove-capacitor");

  const capacitorValuesContainer = document.getElementById(
    "capacitor-values-container"
  );

  const startChargeBtn = document.getElementById("start-charge");
  const startDischargeBtn = document.getElementById("start-discharge");
  const resetBtn = document.getElementById("reset-sim");

  const equivalentCapacitanceSpan = document.getElementById(
    "equivalent-capacitance"
  );

  const timeConstantSpan = document.getElementById("time-constant");
  const canvas = document.getElementById("circuit-canvas");
  const ctx = canvas.getContext("2d");

  // Variables de estado
  let capacitorCount = 0;
  let voltageChart, currentChart;
  let simulationInterval;
  let v0 = 0;
  let switchState = "open"; // 'open', 'charging'

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawWire(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawBattery(x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, y + 20);
    ctx.moveTo(x - 40, y - 2); //positivo
    ctx.lineTo(x + 40, y - 2); //positivo
    ctx.moveTo(x - 20, y + 10); //negativo
    ctx.lineTo(x + 20, y + 10); //negativo
    ctx.stroke();
    ctx.fillText("+", x + 30, y - 8);
    ctx.fillText("-", x + 30, y + 22);
    ctx.fillText("V", x - 55, y + 10);
  }

  function drawResistor(x, y, size = 60, orientation = "horizontal") {
    ctx.beginPath();
    if (orientation === "horizontal") {
      ctx.rect(x - size / 2, y - 8, size, 16);
      ctx.stroke();
      ctx.fillText("R", x, y + 30);
    } else {
      ctx.rect(x - 8, y - size / 2, 16, size);
      ctx.stroke();
      ctx.fillText("R", x + 20, y);
    }
  }

  function drawParallelCapacitor(x, y, label, chargePercentage = 0) {
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.moveTo(x - 15, y + 10);
    ctx.lineTo(x + 15, y + 10);
    ctx.stroke();
    ctx.fillText(label, x + 10, y - 11);

    // Visualización de la carga
    if (chargePercentage > 0) {
      const chargeHeight = 10 * chargePercentage;
      const chargeY = y + 10 - chargeHeight;
      ctx.fillStyle = "rgba(37, 83, 223, 0.53)"; // Color de carga
      ctx.fillRect(x - 15, chargeY, 30, chargeHeight);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
    }
  }

  function drawSeriesCapacitor(x, y, label, chargePercentage = 0) {
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 15);
    ctx.lineTo(x - 5, y + 15);
    ctx.moveTo(x + 5, y - 15);
    ctx.lineTo(x + 5, y + 15);
    ctx.stroke();
    ctx.fillText(label, x, y - 20);

    // Visualización de la carga
    if (chargePercentage > 0) {
      const chargeWidth = 10 * chargePercentage;
      const chargeX = x - 5;
      ctx.fillStyle = "rgba(37, 83, 223, 0.53)"; // Color de carga
      ctx.fillRect(chargeX, y - 15, chargeWidth, 30);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
    }
  }

  function drawSwitch(x, y, state) {
    // Puntos de conexión
    ctx.beginPath();
    ctx.arc(x + 60, y, 4, 0, 2 * Math.PI); // Punto de carga
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI); // Punto de inicio
    ctx.fill();

    // Brazo de la compuerta
    ctx.beginPath();
    ctx.moveTo(x - 50, y);
    ctx.lineTo(x, y);

    if (state === "charging") {
      ctx.lineTo(x + 60, y); // Conectado a carga
    } else {
      ctx.lineTo(x + 60, y - 15); // Abierto
    }
    ctx.stroke();
  }

  function drawCircuit(chargePercentage = 0) {
    clearCanvas();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    const config = configSelect.value;
    const yTop = 100,
      startX = 80;

    // Componentes fijos
    drawBattery(startX + 50, yTop + 50);
    drawSwitch(startX + 100, yTop - 30, switchState);
    drawResistor(startX + 280, yTop + 35, 60, "vertical");

    // Cables
    drawWire(startX + 50, yTop + 47, startX + 50, yTop - 30);
    drawWire(startX + 160, yTop - 30, startX + 320, yTop - 30);
    drawWire(startX + 50, yTop + 60, startX + 50, yTop + 95);
    drawWire(startX + 50, yTop + 95, startX + 290, yTop + 95);
    drawWire(startX + 290, yTop + 95, startX + 450, yTop + 95);
    drawWire(startX + 280, yTop - 30, startX + 280, yTop + 5);
    drawWire(startX + 280, yTop + 65, startX + 280, yTop + 95);

    const capZoneX = startX + 550;

    if (config === "series") {
      drawWire(startX + 320, yTop - 30, capZoneX - 55, yTop - 30);
      let currentX = capZoneX - 50;
      const seriesSpacing = 50;
      for (let i = 0; i < capacitorCount; i++) {
        drawSeriesCapacitor(
          currentX,
          yTop - 30,
          "C" + (i + 1),
          chargePercentage
        );

        if (i < capacitorCount - 1) {
          drawWire(
            currentX + 5,
            yTop - 30,
            currentX + seriesSpacing - 5,
            yTop - 30
          );
        }
        currentX += seriesSpacing;
      }
      const lastCapX = currentX - seriesSpacing;
      drawWire(lastCapX + 5, yTop - 30, lastCapX + 20, yTop - 30); // Conexión a bajada
      drawWire(lastCapX + 20, yTop - 30, lastCapX + 20, yTop + 95); // Bajada
      drawWire(lastCapX + 20, yTop + 95, startX + 350, yTop + 95); // Conexión a R
    } else {
      // Paralelo
      const parallelWidth = 250;
      const busbarTopX1 = startX + 320;
      const busbarTopX2 = busbarTopX1 + parallelWidth;
      const busbarBottomX1 = startX + 450;
      const busbarBottomX2 = busbarBottomX1 + (parallelWidth - 200);

      drawWire(busbarTopX1, yTop - 30, busbarTopX2, yTop - 30);
      drawWire(busbarBottomX1, yTop + 95, busbarBottomX2 + 70, yTop + 95);

      const capSpacing = parallelWidth / (capacitorCount + 1);
      for (let i = 0; i < capacitorCount; i++) {
        const capX = busbarTopX1 + (i + 1) * capSpacing;
        drawWire(capX, yTop - 30, capX, yTop); // Conexión superior
        drawParallelCapacitor(capX, yTop + 5, "C" + (i + 1), chargePercentage);
        drawWire(capX, yTop + 15, capX, yTop + 95); // Conexión inferior
      }
    }
  }

  function addCapacitor() {
    if (capacitorCount >= 5) return;
    capacitorCount++;
    const inputGroup = document.createElement("div");
    inputGroup.className = "capacitor-input-group";
    inputGroup.id = `cap-group-${capacitorCount}`;
    inputGroup.innerHTML = `
            <label for="c-value-${capacitorCount}">C${capacitorCount} (μF):</label>
            <input type="number" id="c-value-${capacitorCount}" class="capacitor-value" value="100" min="1">
        `;
    capacitorValuesContainer.appendChild(inputGroup);
    inputGroup.querySelector("input").addEventListener("input", updateCircuit);
    updateCircuit();
  }

  function removeCapacitor() {
    if (capacitorCount <= 1) return;
    const groupToRemove = document.getElementById(
      `cap-group-${capacitorCount}`
    );
    capacitorValuesContainer.removeChild(groupToRemove);
    capacitorCount--;
    updateCircuit();
  }

  function getCapacitorValues() {
    return Array.from(document.querySelectorAll(".capacitor-value"))
      .map((input) => parseFloat(input.value) * 1e-6)
      .filter((val) => !isNaN(val) && val > 0);
  }

  function calculateEquivalentCapacitance() {
    const values = getCapacitorValues();
    if (values.length === 0) return 0;
    const config = configSelect.value;
    return config === "series"
      ? 1 / values.reduce((acc, c) => acc + 1 / c, 0)
      : values.reduce((acc, c) => acc + c, 0);
  }

  function updateCircuit() {
    const cEq = calculateEquivalentCapacitance();
    const R = parseFloat(resistanceInput.value);
    if (isNaN(cEq) || isNaN(R) || R <= 0 || cEq <= 0) {
      equivalentCapacitanceSpan.textContent = "Error";
      timeConstantSpan.textContent = "Error";
    } else {
      const tau = R * cEq;
      equivalentCapacitanceSpan.textContent = `${(cEq * 1e6).toFixed(2)} μF`;
      timeConstantSpan.textContent = `${tau.toFixed(4)} s`;
    }
    resetSimulation();
  }

  function startSimulation(type) {
    clearInterval(simulationInterval);
    resetCharts();

    switchState = type === "charge" ? "charging" : "open";

    const Vs = parseFloat(voltageInput.value);
    const R = parseFloat(resistanceInput.value);
    const Ceq = calculateEquivalentCapacitance();

    if (isNaN(Vs) || isNaN(R) || isNaN(Ceq) || Vs <= 0 || R <= 0 || Ceq <= 0) {
      alert("Por favor, ingrese valores válidos");
      resetSimulation();
      return;
    }

    const tau = R * Ceq;

    // El tiempo máximo de la simulación 5*tau
    const t_max = 5 * tau;
    const iMax = Vs / R;

    [voltageChart, currentChart].forEach((chart) => {
      chart.options.scales.x.min = 0;
      chart.options.scales.x.max = t_max;
    });
    voltageChart.options.scales.y.min = 0;
    voltageChart.options.scales.y.max = Vs * 1.1;
    currentChart.options.scales.y.min = -iMax * 1.1;
    currentChart.options.scales.y.max = iMax * 1.1;

    let t = 0;

    const dt = t_max / 200;

    simulationInterval = setInterval(() => {
      if (t > t_max) {
        clearInterval(simulationInterval);
        if (type === "charge") {
          v0 = Vs * (1 - Math.exp(-t_max / tau));
          drawCircuit(1);
        } else {
          v0 = 0;
          drawCircuit(0);
        }
        return;
      }

      let v, i, chargePercentage;
      if (type === "charge") {
        v = Vs * (1 - Math.exp(-t / tau));
        i = (Vs / R) * Math.exp(-t / tau);
        chargePercentage = v / Vs;
      } else {
        v = v0 * Math.exp(-t / tau);
        i = -(v0 / R) * Math.exp(-t / tau);
        chargePercentage = v / v0;
      }

      drawCircuit(chargePercentage);

      voltageChart.data.labels.push(t);
      voltageChart.data.datasets[0].data.push(v);
      currentChart.data.labels.push(t);
      currentChart.data.datasets[0].data.push(i);

      voltageChart.update("none");
      currentChart.update("none");

      t += dt;
    }, 10);
  }

  function resetSimulation() {
    clearInterval(simulationInterval);
    resetCharts();
    v0 = 0;
    switchState = "open";
    drawCircuit(0);
  }

  function initCharts() {
    const commonOptions = {
      scales: {
        x: { type: "linear", title: { display: true, text: "Tiempo (s)" } },
        y: { title: { display: true } },
      },
      animation: { duration: 0 },
      maintainAspectRatio: false,
      elements: { point: { radius: 0 } },
    };
    voltageChart = new Chart("voltageChart", {
      type: "line",
      data: {
        datasets: [
          {
            label: "Voltaje (V)",
            data: [],
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            title: { ...commonOptions.scales.y.title, text: "Voltaje (V)" },
          },
        },
      },
    });
    currentChart = new Chart("currentChart", {
      type: "line",
      data: {
        datasets: [
          {
            label: "Corriente (A)",
            data: [],
            borderColor: "rgb(255, 99, 132)",
            tension: 0.1,
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            title: { ...commonOptions.scales.y.title, text: "Corriente (A)" },
          },
        },
      },
    });
  }

  function resetCharts() {
    [voltageChart, currentChart].forEach((chart) => {
      if (chart) {
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.options.scales.x.min = undefined;
        chart.options.scales.x.max = undefined;
        chart.options.scales.y.min = undefined;
        chart.options.scales.y.max = undefined;
        chart.update();
      }
    });
  }

  addCapacitorBtn.addEventListener("click", addCapacitor);
  removeCapacitorBtn.addEventListener("click", removeCapacitor);
  voltageInput.addEventListener("input", updateCircuit);
  resistanceInput.addEventListener("input", updateCircuit);
  configSelect.addEventListener("change", updateCircuit);
  startChargeBtn.addEventListener("click", () => startSimulation("charge"));

  startDischargeBtn.addEventListener("click", () => {
    if (
      voltageInput <= 0 ||
      resistanceInput <= 0 ||
      calculateEquivalentCapacitance() <= 0
    ) {
      alert("Por favor, ingrese valores válidos");
    } else if (v0 <= 0) {
      alert("Debe cargar el capacitor antes de poder iniciar la descarga");
    } else {
      startSimulation("discharge");
    }
  });
  resetBtn.addEventListener("click", resetSimulation);

  // Inicializacion
  initCharts();
  addCapacitor(); // Agrega el primer capacitor e inicializa el dibujo del circuito
});
