const products = {
  customer: {
    id: "DP-CUST-360",
    short: "CUST",
    channel: "API",
    sql: "SELECT * FROM customer_360_v2<br>WHERE updated_at &gt; :watermark",
    folder: "customer_360/",
    temp: ".cust_360_001.parquet.tmp",
    file: "cust_360_001.parquet",
    routes: [0, 1],
    routeLabel: "DP-CUST-360 → CRM + Risk"
  },
  payments: {
    id: "DP-PAYMENTS",
    short: "PAY",
    channel: "Arrow Flight",
    sql: "SELECT * FROM payments_rt<br>WHERE value_date = :business_date",
    folder: "payments/",
    temp: ".payments_001.parquet.tmp",
    file: "payments_001.parquet",
    routes: [1],
    routeLabel: "DP-PAYMENTS → Risk"
  },
  finance: {
    id: "DP-FINANCE",
    short: "FIN",
    channel: "JDBC",
    sql: "SELECT * FROM finance_ledger<br>WHERE ledger_ts &gt; :checkpoint",
    folder: "finance_ledger/",
    temp: ".finance_ledger_001.parquet.tmp",
    file: "finance_ledger_001.parquet",
    routes: [2],
    routeLabel: "DP-FINANCE → Regulatory"
  }
};

const scenarioCopy = {
  normal: "End-to-end flow: extraction, validation, atomic file publication, and 1:N delivery.",
  transient: "Simulates a read timeout: automatic retry with exponential backoff, then resumes the flow.",
  permanent: "Simulates an authorization or SQL contract error: no blind retry; routes to the DLQ and alerts operations."
};

const timelines = {
  normal: [
    { at: 0, stage: "config", message: "Configuration snapshot loaded · SQL + watermark resolved" },
    { at: 500, stage: "extract", message: "SQL submitted through selected channel · reading result set" },
    { at: 1700, stage: "transform", message: "Schema validation passed · records serialized to columnar batches" },
    { at: 2800, stage: "publish", message: "Writing .tmp file · manifest and checksum in progress" },
    { at: 3900, stage: "landing", message: "Atomic rename committed · _SUCCESS marker published" },
    { at: 5000, stage: "core", message: "AIP Core detected complete folder · routing config matched" },
    { at: 6200, stage: "distribute", message: "Dispatching file to configured consumer(s) in parallel" },
    { at: 7400, stage: "complete", message: "Run completed · delivery acknowledged · checkpoint committed" }
  ],
  transient: [
    { at: 0, stage: "config", message: "Configuration snapshot loaded · SQL + watermark resolved" },
    { at: 500, stage: "extract", message: "SQL submitted through selected channel · reading result set" },
    { at: 1800, stage: "error", message: "Read timeout · classified as TRANSIENT / RETRYABLE" },
    { at: 2700, stage: "retry", message: "Retry 1/3 scheduled · exponential backoff 2s + jitter" },
    { at: 3700, stage: "extractRetry", message: "Retry executed · connection restored · extraction resumed" },
    { at: 4700, stage: "transform", message: "Schema validation passed · records serialized to columnar batches" },
    { at: 5700, stage: "publish", message: "Writing .tmp file · manifest and checksum in progress" },
    { at: 6600, stage: "landing", message: "Atomic rename committed · _SUCCESS marker published" },
    { at: 7400, stage: "core", message: "AIP Core detected complete folder · routing config matched" },
    { at: 8200, stage: "distribute", message: "Dispatching file to configured consumer(s) in parallel" },
    { at: 9200, stage: "complete", message: "Recovered run completed · checkpoint committed exactly once" }
  ],
  permanent: [
    { at: 0, stage: "config", message: "Configuration snapshot loaded · SQL + watermark resolved" },
    { at: 500, stage: "extract", message: "SQL submitted through selected channel · reading result set" },
    { at: 1800, stage: "error", message: "Authorization / SQL contract error · classified NON-RETRYABLE" },
    { at: 2900, stage: "dlq", message: "Error context persisted to DLQ · operations alert emitted" },
    { at: 4100, stage: "failed", message: "Run stopped safely · no partial file exposed to AIP Core" }
  ]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentProductKey = "customer";
let currentChannel = products.customer.channel;
let currentScenario = "normal";
let playing = !reducedMotion.matches;
let speed = 1;
let simTime = 0;
let previousFrame = performance.now();
let eventIndex = 0;
let runCounter = 1;
let totalRuns = 128;
let packets = [];
let lastStage = "";
let resizeTimer;

const diagram = $("#diagram");
const svg = $("#flowSvg");
const packetLayer = $("#packetLayer");
const pathIds = [
  "source-adapter", "adapter-landing", "landing-core",
  "core-consumer-0", "core-consumer-1", "core-consumer-2",
  "adapter-error", "error-retry", "retry-adapter", "error-dlq"
];

function currentProduct() {
  return products[currentProductKey];
}

function currentDuration() {
  const events = timelines[currentScenario];
  return events[events.length - 1].at;
}

function runId() {
  return `RUN-${currentProduct().short}-7F2A${String(runCounter).padStart(2, "0")}`;
}

function pointFor(element, side, yRatio = 0.25) {
  const container = diagram.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  let x = rect.left - container.left;
  if (side === "right") x = rect.right - container.left;
  if (side === "center") x = rect.left - container.left + rect.width / 2;
  let y = rect.top - container.top + rect.height * yRatio;
  if (side === "top") y = rect.top - container.top;
  if (side === "bottom") y = rect.bottom - container.top;
  return { x, y };
}

function horizontalPath(start, end, bend = 0.5) {
  const delta = Math.max(24, Math.abs(end.x - start.x) * bend);
  const direction = end.x >= start.x ? 1 : -1;
  return `M ${start.x} ${start.y} C ${start.x + delta * direction} ${start.y}, ${end.x - delta * direction} ${end.y}, ${end.x} ${end.y}`;
}

function setPath(id, d) {
  const path = $(`#path-${id}`);
  if (path) path.setAttribute("d", d);
}

function drawConnections() {
  const source = $("#sourceNode");
  const adapter = $("#adapterNode");
  const landing = $("#landingNode");
  const core = $("#coreNode");
  const error = $("#errorModule");
  const retry = $("#retryModule");
  const dlq = $("#dlqModule");

  setPath("source-adapter", horizontalPath(pointFor(source, "right", .23), pointFor(adapter, "left", .23)));
  setPath("adapter-landing", horizontalPath(pointFor(adapter, "right", .23), pointFor(landing, "left", .23)));
  setPath("landing-core", horizontalPath(pointFor(landing, "right", .23), pointFor(core, "left", .23)));

  for (let i = 0; i < 3; i += 1) {
    const consumer = $(`#consumer-${i}`);
    const start = pointFor(core, "right", .55);
    const container = diagram.getBoundingClientRect();
    const rect = consumer.getBoundingClientRect();
    const end = { x: rect.left - container.left, y: rect.top - container.top + rect.height / 2 };
    setPath(`core-consumer-${i}`, horizontalPath(start, end, .42));
  }

  const adapterBottom = pointFor(adapter, "center");
  adapterBottom.y = adapter.getBoundingClientRect().bottom - diagram.getBoundingClientRect().top;
  const errorTop = pointFor(error, "center");
  errorTop.y = error.getBoundingClientRect().top - diagram.getBoundingClientRect().top;
  setPath("adapter-error", `M ${adapterBottom.x} ${adapterBottom.y} C ${adapterBottom.x} ${adapterBottom.y + 34}, ${errorTop.x} ${errorTop.y - 34}, ${errorTop.x} ${errorTop.y}`);
  setPath("error-retry", horizontalPath(pointFor(error, "left", .5), pointFor(retry, "right", .5)));
  const retryTop = pointFor(retry, "center");
  retryTop.y = retry.getBoundingClientRect().top - diagram.getBoundingClientRect().top;
  setPath("retry-adapter", `M ${retryTop.x} ${retryTop.y} C ${retryTop.x - 20} ${retryTop.y - 42}, ${adapterBottom.x - 45} ${adapterBottom.y + 38}, ${adapterBottom.x - 20} ${adapterBottom.y}`);
  setPath("error-dlq", horizontalPath(pointFor(error, "right", .5), pointFor(dlq, "left", .5)));

  packets.forEach((packet) => {
    const path = $(`#path-${packet.path}`);
    packet.length = path?.getTotalLength() || 0;
  });
}

function updateProductUI() {
  const product = currentProduct();
  $("#sqlPreview").innerHTML = product.sql;
  $("#sqlChannelLabel").textContent = currentChannel;
  $("#folderProduct").textContent = product.folder;
  $("#tempFileName").textContent = product.temp;
  $("#finalFileName").textContent = product.file;
  $("#routePreview").textContent = product.routeLabel;
  $("#runId").textContent = runId();
  $("#runSummary").textContent = `${product.id} · ${currentChannel} · attempt 1`;

  $$(".product-button").forEach((button) => {
    const selected = button.dataset.product === currentProductKey;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $$(".channel-button").forEach((button) => {
    const selected = button.dataset.channel === currentChannel;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  for (let i = 0; i < 3; i += 1) {
    $(`#consumer-${i}`).classList.toggle("routed", product.routes.includes(i));
    $(`#path-core-consumer-${i}`).style.opacity = product.routes.includes(i) ? "1" : ".16";
  }
  $("#consumerStatus").textContent = `0 / ${product.routes.length} ROUTED`;
}

function resetVisualState() {
  $$(".architecture-node").forEach((node) => node.classList.remove("active", "completed", "failed"));
  $$(".adapter-stage").forEach((stage) => {
    stage.classList.remove("active", "completed");
    stage.querySelector(".stage-state").textContent = "WAIT";
  });
  $("#stage-config .stage-state").textContent = "READY";
  $$(".core-flow > div").forEach((step) => step.classList.remove("active"));
  $$(".reliability-module").forEach((module) => module.classList.remove("active", "failed"));
  $$(".consumer-item").forEach((consumer) => consumer.classList.remove("active", "delivered"));
  $$(".timeline-step").forEach((step) => step.classList.remove("active", "completed"));
  $$(".folder-file").forEach((file) => file.classList.remove("active", "complete"));
  $("#tempFile").style.display = "none";
  $("#retryCount").textContent = "0 / 3 attempts";
  $("#dlqStatus").textContent = "STANDBY";
  $("#metricFailures").textContent = "0";
  $("#sourceStatus").textContent = "READY";
  $("#adapterStatus").textContent = "IDLE";
  $("#landingStatus").textContent = "WAITING";
  $("#coreStatus").textContent = "POLLING";
  $("#consumerStatus").textContent = `0 / ${currentProduct().routes.length} ROUTED`;
  $("#runSummary").textContent = `${currentProduct().id} · ${currentChannel} · attempt 1`;
  lastStage = "";
}

function setTimeline(stage) {
  const steps = $$(".timeline-step");
  steps.forEach((step) => step.classList.remove("active", "completed"));
  const stageMap = {
    config: "source", extract: "source", extractRetry: "source", error: "source", retry: "source",
    transform: "transform", publish: "landing", landing: "landing", core: "core", distribute: "core",
    dlq: "source", failed: "source"
  };
  if (stage === "complete") {
    steps.forEach((step) => step.classList.add("completed"));
    return;
  }
  const currentName = stageMap[stage] || "source";
  const currentIndex = steps.findIndex((step) => step.dataset.timeline === currentName);
  steps.forEach((step, index) => {
    if (index < currentIndex) step.classList.add("completed");
    if (index === currentIndex) step.classList.add("active");
  });
}

function completeAdapterStages(names) {
  names.forEach((name) => {
    const stage = $(`#stage-${name}`);
    stage.classList.remove("active");
    stage.classList.add("completed");
    stage.querySelector(".stage-state").textContent = "DONE";
  });
}

function activateAdapterStage(name, label) {
  const stage = $(`#stage-${name}`);
  stage.classList.add("active");
  stage.querySelector(".stage-state").textContent = label;
}

function applyStage(stage, message) {
  const previous = lastStage;
  resetVisualState();
  lastStage = stage;
  setTimeline(stage);
  const product = currentProduct();
  const source = $("#sourceNode");
  const adapter = $("#adapterNode");
  const landing = $("#landingNode");
  const core = $("#coreNode");
  const consumers = $("#consumersNode");

  if (["extract", "transform", "publish", "landing", "core", "distribute", "complete"].includes(stage)) {
    source.classList.add("completed");
    source.querySelector(".node-status").textContent = "EXTRACTED";
  }

  if (stage === "config") {
    source.classList.add("active");
    adapter.classList.add("active");
    $("#sourceStatus").textContent = "SELECTED";
    $("#adapterStatus").textContent = "CONFIGURING";
    activateAdapterStage("config", "ACTIVE");
  }

  if (["extract", "extractRetry"].includes(stage)) {
    adapter.classList.add("active");
    $("#adapterStatus").textContent = stage === "extractRetry" ? "RETRYING" : "EXTRACTING";
    completeAdapterStages(["config"]);
    activateAdapterStage("extract", stage === "extractRetry" ? "RETRY 1" : "RUNNING");
    if (stage === "extractRetry") {
      $("#retryCount").textContent = "1 / 3 attempts";
      $("#runSummary").textContent = `${product.id} · ${currentChannel} · attempt 2`;
    }
  }

  if (["transform", "publish", "landing", "core", "distribute", "complete"].includes(stage)) {
    completeAdapterStages(["config", "extract"]);
  }

  if (stage === "transform") {
    adapter.classList.add("active");
    $("#adapterStatus").textContent = "VALIDATING";
    activateAdapterStage("transform", "RUNNING");
  }

  if (["publish", "landing", "core", "distribute", "complete"].includes(stage)) {
    completeAdapterStages(["transform"]);
  }

  if (stage === "publish") {
    adapter.classList.add("active");
    landing.classList.add("active");
    $("#adapterStatus").textContent = "WRITING";
    $("#landingStatus").textContent = "RECEIVING .TMP";
    activateAdapterStage("publish", "WRITING");
    $("#tempFile").style.display = "grid";
    $("#tempFile").classList.add("active");
  }

  if (["landing", "core", "distribute", "complete"].includes(stage)) {
    adapter.classList.add("completed");
    completeAdapterStages(["publish"]);
    $("#adapterStatus").textContent = "PUBLISHED";
    landing.classList.add(stage === "landing" ? "active" : "completed");
    $("#landingStatus").textContent = "COMMITTED";
    $("#finalFile").classList.add("complete");
    $("#successFile").classList.add("complete");
  }

  if (["core", "distribute"].includes(stage)) {
    core.classList.add("active");
    $("#coreStatus").textContent = stage === "core" ? "ROUTING" : "DISPATCHING";
    $("#corePoller").classList.add("active");
    $("#coreProcess").classList.add("active");
    $("#coreRouter").classList.add("active");
    if (stage === "distribute") {
      $("#coreDispatcher").classList.add("active");
      product.routes.forEach((index) => $(`#consumer-${index}`).classList.add("active"));
      $("#consumerStatus").textContent = `0 / ${product.routes.length} DELIVERED`;
    }
  }

  if (stage === "complete") {
    core.classList.add("completed");
    consumers.classList.add("completed");
    $("#coreStatus").textContent = "ROUTED";
    product.routes.forEach((index) => $(`#consumer-${index}`).classList.add("delivered"));
    $("#consumerStatus").textContent = `${product.routes.length} / ${product.routes.length} DELIVERED`;
    if (previous !== "complete") {
      totalRuns += 1;
      $("#metricRuns").textContent = String(totalRuns);
    }
  }

  if (stage === "error") {
    adapter.classList.add("failed");
    $("#adapterStatus").textContent = "ERROR";
    completeAdapterStages(["config"]);
    activateAdapterStage("extract", "FAILED");
    $("#errorModule").classList.add("active");
  }

  if (stage === "retry") {
    adapter.classList.add("active");
    $("#adapterStatus").textContent = "BACKOFF";
    completeAdapterStages(["config"]);
    $("#retryModule").classList.add("active");
    $("#retryCount").textContent = "1 / 3 attempts";
  }

  if (["dlq", "failed"].includes(stage)) {
    adapter.classList.add("failed");
    $("#adapterStatus").textContent = "FAILED";
    completeAdapterStages(["config"]);
    activateAdapterStage("extract", "FAILED");
    $("#errorModule").classList.add("failed");
    $("#dlqModule").classList.add("failed");
    $("#dlqStatus").textContent = "1 EVENT · ALERTED";
    $("#landingStatus").textContent = "NO FILE EXPOSED";
    $("#coreStatus").textContent = "SKIPPED";
    $("#metricFailures").textContent = "1";
  }

  $("#eventMessage").textContent = message;
}

function addPacket(path, start, duration, kind = "data") {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", kind === "error" ? "5" : "4.5");
  circle.setAttribute("class", `data-packet ${kind === "error" ? "error" : ""}`);
  circle.setAttribute("opacity", "0");
  packetLayer.appendChild(circle);
  const pathElement = $(`#path-${path}`);
  packets.push({ path, start, duration, kind, circle, element: pathElement, length: pathElement?.getTotalLength() || 0 });
}

function buildPackets() {
  packetLayer.replaceChildren();
  packets = [];
  addPacket("source-adapter", 350, 950);
  if (currentScenario === "normal") {
    addPacket("adapter-landing", 3000, 900);
    addPacket("landing-core", 4900, 800);
    currentProduct().routes.forEach((route, index) => addPacket(`core-consumer-${route}`, 6250 + index * 120, 750, "success"));
  } else if (currentScenario === "transient") {
    addPacket("adapter-error", 1800, 700, "error");
    addPacket("error-retry", 2700, 600, "error");
    addPacket("retry-adapter", 3400, 600, "error");
    addPacket("adapter-landing", 5900, 800);
    addPacket("landing-core", 7300, 750);
    currentProduct().routes.forEach((route, index) => addPacket(`core-consumer-${route}`, 8250 + index * 120, 750, "success"));
  } else {
    addPacket("adapter-error", 1800, 750, "error");
    addPacket("error-dlq", 2900, 700, "error");
  }
}

function renderPackets() {
  pathIds.forEach((id) => $(`#path-${id}`)?.classList.remove("active"));
  packets.forEach((packet) => {
    const elapsed = simTime - packet.start;
    if (elapsed < 0 || elapsed > packet.duration || !packet.element || !packet.length) {
      packet.circle.setAttribute("opacity", "0");
      return;
    }
    const progress = Math.min(1, Math.max(0, elapsed / packet.duration));
    const position = packet.element.getPointAtLength(progress * packet.length);
    packet.circle.setAttribute("cx", position.x);
    packet.circle.setAttribute("cy", position.y);
    const fade = Math.min(1, progress * 6, (1 - progress) * 6);
    packet.circle.setAttribute("opacity", String(Math.max(0, fade)));
    $(`#path-${packet.path}`)?.classList.add("active");
  });
}

function updatePlaybackUI() {
  const ended = currentScenario === "permanent" && simTime >= currentDuration();
  $("#pauseIcon").hidden = !playing;
  $("#playIcon").hidden = playing;
  $("#playLabel").textContent = playing ? "Pause" : ended ? "Rerun" : "Resume";
  $("#playButton").setAttribute("aria-label", playing ? "Pause flow" : ended ? "Rerun flow" : "Resume flow");
  $("#liveDot").classList.toggle("paused", !playing && !ended);
  $("#liveDot").classList.toggle("failed", ended);
  $("#runStateLabel").textContent = ended ? "FAILED · ACTION REQUIRED" : playing ? "RUNNING" : "PAUSED";
  $("#runStateLabel").style.color = ended ? "oklch(0.75 0.18 27)" : "";
}

function formatTime(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function resetRun({ increment = true, autoplay = true } = {}) {
  if (increment) runCounter += 1;
  simTime = 0;
  eventIndex = 0;
  playing = autoplay;
  previousFrame = performance.now();
  resetVisualState();
  updateProductUI();
  buildPackets();
  drawConnections();
  const first = timelines[currentScenario][0];
  applyStage(first.stage, first.message);
  eventIndex = 1;
  $("#eventTime").textContent = "00:00.0";
  updatePlaybackUI();
}

function tick(now) {
  const delta = Math.min(80, now - previousFrame);
  previousFrame = now;
  if (playing) simTime += delta * speed;

  const events = timelines[currentScenario];
  while (eventIndex < events.length && simTime >= events[eventIndex].at) {
    const event = events[eventIndex];
    applyStage(event.stage, event.message);
    eventIndex += 1;
  }

  if (currentScenario !== "permanent" && simTime > currentDuration() + 2400) {
    resetRun({ increment: true, autoplay: true });
  } else if (currentScenario === "permanent" && simTime >= currentDuration()) {
    simTime = currentDuration();
    if (playing) {
      playing = false;
      updatePlaybackUI();
    }
  }

  renderPackets();
  $("#eventTime").textContent = formatTime(simTime);
  requestAnimationFrame(tick);
}

$$(".scenario-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentScenario = button.dataset.scenario;
    $$(".scenario-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    $("#scenarioHint").textContent = scenarioCopy[currentScenario];
    resetRun({ increment: true, autoplay: true });
  });
});

$$(".product-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentProductKey = button.dataset.product;
    currentChannel = currentProduct().channel;
    resetRun({ increment: true, autoplay: true });
  });
});

$$(".channel-button").forEach((button) => {
  button.addEventListener("click", () => {
    currentChannel = button.dataset.channel;
    resetRun({ increment: true, autoplay: true });
  });
});

$("#playButton").addEventListener("click", () => {
  if (!playing && simTime >= currentDuration()) {
    resetRun({ increment: true, autoplay: true });
    return;
  }
  playing = !playing;
  previousFrame = performance.now();
  updatePlaybackUI();
});

$("#restartButton").addEventListener("click", () => resetRun({ increment: true, autoplay: true }));

$("#speedButton").addEventListener("click", () => {
  const speeds = [1, 1.5, 2];
  speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
  $("#speedButton").textContent = `${speed}×`;
  $("#speedButton").setAttribute("aria-label", `Playback speed ${speed}x. Click to change.`);
});

$("#printButton").addEventListener("click", () => window.print());

reducedMotion.addEventListener("change", (event) => {
  if (event.matches) {
    playing = false;
    updatePlaybackUI();
  }
});

const observer = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawConnections, 60);
});
observer.observe(diagram);

updateProductUI();
resetVisualState();
resetRun({ increment: false, autoplay: playing });
requestAnimationFrame(tick);
