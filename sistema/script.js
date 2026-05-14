const body = document.querySelector("#items-body");
const template = document.querySelector("#row-template");
const addRowButton = document.querySelector("#add-row");
const addInlineButtons = document.querySelectorAll(".add-item-inline");
const printButton = document.querySelector("#print");
const clearButton = document.querySelector("#clear");
const grandTotal = document.querySelector("#grand-total");
const dateInput = document.querySelector("#proposal-date");

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function todayForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function numberFrom(input) {
  return Number.parseFloat(input.value.replace(",", ".")) || 0;
}

function calculateRow(row) {
  const unit = numberFrom(row.querySelector(".unit"));
  const meter = numberFrom(row.querySelector(".meter"));
  const price = numberFrom(row.querySelector(".unit-price"));
  const amountBase = meter > 0 ? unit * meter : unit;
  const total = amountBase * price;
  row.querySelector(".row-total").textContent = money.format(total);
  return total;
}

function calculateAll() {
  let total = 0;
  body.querySelectorAll("tr").forEach((row) => {
    total += calculateRow(row);
  });
  grandTotal.textContent = money.format(total);
}

function renumberRows() {
  body.querySelectorAll("tr").forEach((row, index) => {
    const itemInput = row.querySelector(".item");
    if (!itemInput.value) {
      itemInput.value = String(index + 1).padStart(2, "0");
    }
  });
}

function addRow(data = {}) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector(".item").value = data.item || "";
  row.querySelector(".unit").value = data.unit ?? 1;
  row.querySelector(".meter").value = data.meter ?? 0;
  row.querySelector(".description").value = data.description || "";
  row.querySelector(".unit-price").value = data.unitPrice ?? 0;
  body.appendChild(row);
  renumberRows();
  calculateAll();
}

body.addEventListener("input", (event) => {
  if (event.target.matches("input, textarea")) {
    calculateAll();
  }
});

body.addEventListener("click", (event) => {
  if (!event.target.matches(".remove-row")) {
    return;
  }

  const rows = body.querySelectorAll("tr");
  if (rows.length === 1) {
    rows[0].querySelectorAll("input, textarea").forEach((field) => {
      field.value = field.classList.contains("unit") ? "1" : "0";
    });
    rows[0].querySelector(".item").value = "01";
    rows[0].querySelector(".description").value = "";
  } else {
    event.target.closest("tr").remove();
  }
  calculateAll();
});

addRowButton.addEventListener("click", () => addRow());
addInlineButtons.forEach((button) => {
  button.addEventListener("click", () => addRow());
});
printButton.addEventListener("click", () => window.print());
clearButton.addEventListener("click", () => {
  document.querySelector("#client-address").value = "";
  body.innerHTML = "";
  addRow();
});

dateInput.value = todayForInput();
addRow({
  description: "Sistema de CFTV",
  unit: 1,
  meter: 0,
  unitPrice: 0
});
