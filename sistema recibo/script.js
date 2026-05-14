const counterInput = document.querySelector("#counterInput");
const receiptNumber = document.querySelector("#receiptNumber");
const saveCounterButton = document.querySelector("#saveCounter");
const previousNumberButton = document.querySelector("#previousNumber");
const nextNumberButton = document.querySelector("#nextNumber");
const clearReceiptButton = document.querySelector("#clearReceipt");
const printReceiptButton = document.querySelector("#printReceipt");
const amountInput = document.querySelector("#amount");
const amountWordsInput = document.querySelector("#amountWords");
const cpfInput = document.querySelector("#cpf");
const dayInput = document.querySelector("#day");
const monthInput = document.querySelector("#month");
const yearInput = document.querySelector("#year");

const fieldsToSave = Array.from(document.querySelectorAll("[data-save]"));
const fieldsToClear = Array.from(document.querySelectorAll("[data-clearable]"));

const counterKey = "sistema-recibo-contador";
const draftKey = "sistema-recibo-dados";

let currentNumber = readCounter();
let lastGeneratedAmountWords = "";

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return false;
  }

  return true;
}

function readCounter() {
  const saved = Number(storageGet(counterKey));
  return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 1;
}

function formatNumber(number) {
  return String(number).padStart(4, "0");
}

function setCounter(number) {
  const nextNumber = Math.max(1, Math.floor(Number(number) || 1));
  currentNumber = nextNumber;
  receiptNumber.value = formatNumber(currentNumber);
  counterInput.value = currentNumber;
  storageSet(counterKey, String(currentNumber));
}

function saveDraft() {
  const draft = {};

  fieldsToSave.forEach((field) => {
    draft[field.id] = field.value;
  });

  storageSet(draftKey, JSON.stringify(draft));
}

function restoreDraft() {
  const saved = storageGet(draftKey);

  if (!saved) {
    fillToday();
    return;
  }

  try {
    const draft = JSON.parse(saved);

    fieldsToSave.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(draft, field.id)) {
        field.value = draft[field.id];
      }
    });
  } catch {
    fillToday();
  }

  if (!dayInput.value || !monthInput.value || !yearInput.value) {
    fillToday();
  }
}

function fillToday() {
  const today = new Date();
  dayInput.value = String(today.getDate()).padStart(2, "0");
  monthInput.value = today.toLocaleString("pt-BR", { month: "long" });
  yearInput.value = String(today.getFullYear());
}

function clearReceipt() {
  fieldsToClear.forEach((field) => {
    field.value = "";
  });

  fillToday();
  lastGeneratedAmountWords = "";
  saveDraft();
  document.querySelector("#receivedFrom").focus();
}

function parseMoney(value) {
  const cleanValue = value
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!cleanValue) {
    return null;
  }

  let normalized = cleanValue;

  if (cleanValue.includes(",") && cleanValue.includes(".")) {
    normalized = cleanValue.replace(/\./g, "").replace(",", ".");
  } else if (cleanValue.includes(",")) {
    normalized = cleanValue.replace(",", ".");
  } else if ((cleanValue.match(/\./g) || []).length > 1) {
    normalized = cleanValue.replace(/\./g, "");
  } else if (/^\d+\.\d{3}$/.test(cleanValue)) {
    normalized = cleanValue.replace(".", "");
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function formatMoney(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function handleAmountBlur() {
  const amount = parseMoney(amountInput.value);

  if (amount === null) {
    saveDraft();
    return;
  }

  amountInput.value = formatMoney(amount);

  const words = capitalizeFirst(moneyToWords(amount));
  const canReplaceWords = !amountWordsInput.value || amountWordsInput.value === lastGeneratedAmountWords;

  if (canReplaceWords) {
    amountWordsInput.value = words;
    lastGeneratedAmountWords = words;
  }

  saveDraft();
}

function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function moneyToWords(value) {
  const totalCents = Math.round(Math.abs(value) * 100);
  const reais = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  const parts = [];

  if (reais > 0) {
    parts.push(`${numberToWords(reais)} ${reais === 1 ? "real" : "reais"}`);
  }

  if (cents > 0) {
    parts.push(`${numberToWords(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
  }

  if (parts.length === 0) {
    return "zero real";
  }

  return parts.join(" e ");
}

function numberToWords(number) {
  const value = Math.floor(number);

  if (value < 1000) {
    return wordsBelowThousand(value);
  }

  const groups = [
    { size: 1000000000, singular: "bilhão", plural: "bilhões" },
    { size: 1000000, singular: "milhão", plural: "milhões" },
    { size: 1000, singular: "mil", plural: "mil" }
  ];

  let remaining = value;
  const parts = [];

  groups.forEach((group) => {
    const quantity = Math.floor(remaining / group.size);

    if (quantity === 0) {
      return;
    }

    if (group.size === 1000) {
      parts.push(quantity === 1 ? "mil" : `${wordsBelowThousand(quantity)} mil`);
    } else {
      parts.push(`${numberToWords(quantity)} ${quantity === 1 ? group.singular : group.plural}`);
    }

    remaining %= group.size;
  });

  if (remaining > 0) {
    parts.push(wordsBelowThousand(remaining));
  }

  return joinNumberParts(parts, remaining);
}

function joinNumberParts(parts, remaining) {
  if (parts.length <= 1) {
    return parts[0] || "";
  }

  const last = parts.pop();
  const separator = remaining > 0 && remaining < 100 ? " e " : ", ";
  return `${parts.join(", ")}${separator}${last}`;
}

function wordsBelowThousand(number) {
  const units = [
    "zero",
    "um",
    "dois",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove"
  ];
  const teens = [
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove"
  ];
  const tens = [
    "",
    "",
    "vinte",
    "trinta",
    "quarenta",
    "cinquenta",
    "sessenta",
    "setenta",
    "oitenta",
    "noventa"
  ];
  const hundreds = [
    "",
    "cento",
    "duzentos",
    "trezentos",
    "quatrocentos",
    "quinhentos",
    "seiscentos",
    "setecentos",
    "oitocentos",
    "novecentos"
  ];

  if (number < 10) {
    return units[number];
  }

  if (number < 20) {
    return teens[number - 10];
  }

  if (number < 100) {
    const ten = Math.floor(number / 10);
    const unit = number % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} e ${units[unit]}`;
  }

  if (number === 100) {
    return "cem";
  }

  const hundred = Math.floor(number / 100);
  const rest = number % 100;
  return rest === 0 ? hundreds[hundred] : `${hundreds[hundred]} e ${wordsBelowThousand(rest)}`;
}

function maskCpf(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

fieldsToSave.forEach((field) => {
  field.addEventListener("input", saveDraft);
});

counterInput.addEventListener("change", () => setCounter(counterInput.value));

saveCounterButton.addEventListener("click", () => {
  setCounter(counterInput.value);
  counterInput.focus();
});

previousNumberButton.addEventListener("click", () => {
  setCounter(currentNumber - 1);
});

nextNumberButton.addEventListener("click", () => {
  setCounter(currentNumber + 1);
  clearReceipt();
});

clearReceiptButton.addEventListener("click", clearReceipt);

printReceiptButton.addEventListener("click", () => {
  saveDraft();
  window.print();
});

amountInput.addEventListener("blur", handleAmountBlur);

cpfInput.addEventListener("input", () => {
  cpfInput.value = maskCpf(cpfInput.value);
  saveDraft();
});

setCounter(currentNumber);
restoreDraft();
