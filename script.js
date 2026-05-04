const planCards = document.querySelectorAll(".plan-card");
const paymentOptions = document.querySelectorAll(".payment-card");
const summaryPlan = document.querySelector("#summaryPlan");
const summaryPrice = document.querySelector("#summaryPrice");
const paymentHelp = document.querySelector("#paymentHelp");
const form = document.querySelector("#checkout");
const submitButton = form.querySelector("button[type='submit']");
const gmailInput = document.querySelector("#gmail");
const emailError = document.querySelector("#emailError");
const modal = document.querySelector("#paymentModal");
const modalTitle = document.querySelector("#modalTitle");
const modalText = document.querySelector("#modalText");
const paymentBox = document.querySelector("#paymentBox");
const closeButton = document.querySelector(".close-button");
const doneButton = document.querySelector("#doneButton");
const paymentTimer = document.querySelector("#paymentTimer");
const paymentTimerBox = document.querySelector(".payment-timer");
const transactionInput = document.querySelector("#transactionId");
const transactionError = document.querySelector("#transactionError");
const transactionField = document.querySelector(".transaction-field");
const pendingOverlay = document.querySelector("#pendingOverlay");
const pendingOverlayClose = document.querySelector("#pendingOverlayClose");
const failedOverlay = document.querySelector("#failedOverlay");
const failedOverlayClose = document.querySelector("#failedOverlayClose");

const merchantPayment = {
  paypalClientId: "AcBECIH3uD0SvO5ejDCNnD4CUSmhH3gMkOtK_ni2Qx1V5hivmAAowTU86xhU5GTdbaWkeKw6vdeuHy_N",
  paypalEmail: "harshsingh9993@gmail.com",
  ownerEmail: "harshbusiness08@gmail.com",
  usdtTrc20Address: "TTZsRB6LvEBZN5pNcCWu8qWK6o19rs19jB",
  usdtBep20Address: "0x3c94abad8df6f8a5767c4eebda91f49b635652a7",
  usdcBep20Address: "0x3c94abad8df6f8a5767c4eebda91f49b635652a7"
};

const checkoutState = {
  plan: null,
  paymentMethod: "",
  email: "",
  transactionId: ""
};

const paymentWindowSeconds = 15 * 60;
let paymentIntervalId;
let remainingPaymentSeconds = paymentWindowSeconds;

const paymentCopy = {
  paypal: "Continue to live PayPal checkout after confirming your email address.",
  usdt: "Send USDT on TRC20 and include your email address in the payment note.",
  "usdt-bep20": "Send USDT on BEP20 and include your email address in the payment note.",
  "usdc-bep20": "Send USDC on BEP20 and include your email address in the payment note."
};

function selectedPlan() {
  const input = document.querySelector("input[name='plan']:checked");
  return {
    label: input.dataset.label,
    price: input.dataset.price
  };
}

function selectedPayment() {
  return document.querySelector("input[name='payment']:checked").value;
}

function updatePlanState() {
  planCards.forEach((card) => {
    card.classList.toggle("active", card.querySelector("input").checked);
  });

  const plan = selectedPlan();
  summaryPlan.textContent = plan.label;
  summaryPrice.textContent = `$${plan.price}`;
}

function updatePaymentState() {
  paymentOptions.forEach((option) => {
    option.classList.toggle("active", option.querySelector("input").checked);
  });

  const method = selectedPayment();
  paymentHelp.textContent = paymentCopy[method];
  if (method === "paypal") {
    submitButton.textContent = "Pay with PayPal";
  } else if (method === "usdc-bep20") {
    submitButton.textContent = "Continue USDC payment";
  } else {
    submitButton.textContent = "Continue USDT payment";
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isGmail(value) {
  return isEmail(value);
}

function sendOwnerEmailNotification({ email, plan, paymentMethod, transactionId, stage = "Checkout started" }) {
  const subject = encodeURIComponent(`RealMaria ${stage}: ${plan.label} - ${paymentMethod}`);
  const bodyLines = [
    `Stage: ${stage}`,
    `Subscriber email: ${email}`,
    `Selected plan: ${plan.label}`,
    `Price: $${plan.price}`,
    `Payment method: ${paymentMethod}`
  ];

  if (paymentMethod === "paypal") {
    bodyLines.push(`PayPal destination: ${merchantPayment.paypalEmail}`);
  } else if (paymentMethod === "usdt") {
    bodyLines.push(`TRC20 address: ${merchantPayment.usdtTrc20Address}`);
  } else if (paymentMethod === "usdt-bep20") {
    bodyLines.push(`BEP20 address: ${merchantPayment.usdtBep20Address}`);
  } else if (paymentMethod === "usdc-bep20") {
    bodyLines.push(`USDC BEP20 address: ${merchantPayment.usdcBep20Address}`);
  }

  if (transactionId) {
    bodyLines.push(`Transaction / receipt ID: ${transactionId}`);
  } else {
    bodyLines.push(`Transaction / receipt ID: Pending or not submitted yet`);
  }

  bodyLines.push("", `Captured from the RealMaria checkout form.`, `Timestamp: ${new Date().toLocaleString()}`);

  const body = encodeURIComponent(bodyLines.join("\n"));
  const mailto = `mailto:${merchantPayment.ownerEmail}?subject=${subject}&body=${body}`;
  window.open(mailto, "_blank");
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopPaymentTimer() {
  if (paymentIntervalId) {
    clearInterval(paymentIntervalId);
    paymentIntervalId = undefined;
  }
}

function startPaymentTimer() {
  stopPaymentTimer();
  remainingPaymentSeconds = paymentWindowSeconds;
  paymentTimer.textContent = formatTime(remainingPaymentSeconds);
  paymentTimerBox.classList.remove("expired");

  paymentIntervalId = setInterval(() => {
    remainingPaymentSeconds -= 1;
    paymentTimer.textContent = formatTime(Math.max(remainingPaymentSeconds, 0));

    if (remainingPaymentSeconds <= 0) {
      stopPaymentTimer();
      paymentTimerBox.classList.add("expired");
      transactionError.textContent = "This 15 minute payment window expired. Close and start again.";
    }
  }, 1000);
}

function resetTransactionField() {
  transactionInput.value = "";
  transactionInput.disabled = false;
  transactionField.hidden = false;
  transactionError.textContent = "";
  doneButton.textContent = "Submit payment details";
  doneButton.hidden = false;
  doneButton.dataset.submitted = "false";
}

function showSubmittedPayment(transactionId) {
  checkoutState.transactionId = transactionId;
  sendOwnerEmailNotification(checkoutState);
  stopPaymentTimer();
  modalTitle.textContent = "Payment details submitted";
  modalText.textContent = "Your transaction ID has been captured in this browser session.";
  paymentBox.innerHTML = `
    <strong>Submitted transaction</strong>
    <p class="copy-line">${transactionId}</p>
    <p>Keep this ID safe for payment verification.</p>
  `;
  transactionField.hidden = false;
  transactionInput.value = transactionId;
  transactionInput.disabled = true;
  doneButton.textContent = "Close";
  doneButton.hidden = false;
  doneButton.dataset.submitted = "true";
}

function showPendingOverlay(transactionId) {
  if (!pendingOverlay) return;
  const idNode = pendingOverlay.querySelector(".pending-transaction-id");
  if (idNode) {
    idNode.textContent = transactionId;
  }
  pendingOverlay.hidden = false;
  document.body.style.overflow = "hidden";

  // Show failed overlay after 30 seconds
  setTimeout(() => {
    hidePendingOverlay();
    showFailedOverlay(transactionId);
  }, 30000);
}

function hidePendingOverlay() {
  if (!pendingOverlay) return;
  pendingOverlay.hidden = true;
  document.body.style.overflow = "";
}

function showFailedOverlay(transactionId) {
  if (!failedOverlay) return;
  const idNode = failedOverlay.querySelector(".failed-transaction-id");
  if (idNode) {
    idNode.textContent = transactionId;
  }
  failedOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function hideFailedOverlay() {
  if (!failedOverlay) return;
  failedOverlay.hidden = true;
  document.body.style.overflow = "";
}

function renderPayPalButton(plan, gmail) {
  const container = document.querySelector("#paypalButtonContainer");

  if (!window.paypal || !container) {
    container.innerHTML = "<p>PayPal checkout could not load. Refresh the page and try again.</p>";
    return;
  }

  window.paypal.Buttons({
    style: {
      shape: "rect",
      color: "gold",
      layout: "vertical",
      label: "paypal"
    },
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{
        description: `RealMaria Private Content - ${plan.label}`,
        custom_id: gmail,
        amount: {
          currency_code: "USD",
          value: plan.price
        }
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING"
      }
    }),
    onApprove: (data, actions) => actions.order.capture().then((details) => {
      const capture = details.purchase_units?.[0]?.payments?.captures?.[0];
      showSubmittedPayment(capture?.id || data.orderID);
    }),
    onCancel: () => {
      transactionError.textContent = "PayPal payment was cancelled. You can try again within this payment window.";
    },
    onError: () => {
      transactionError.textContent = "PayPal checkout had an issue. Refresh the page and try again.";
    }
  }).render("#paypalButtonContainer");
}

planCards.forEach((card) => {
  card.addEventListener("click", updatePlanState);
});

paymentOptions.forEach((option) => {
  option.addEventListener("click", updatePaymentState);
});

gmailInput.addEventListener("input", () => {
  if (!gmailInput.value || isGmail(gmailInput.value)) {
    emailError.textContent = "";
    return;
  }

  emailError.textContent = "Please enter a valid email address.";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const gmail = gmailInput.value.trim();

  if (!isGmail(gmail)) {
    emailError.textContent = "An email address is required before payment.";
    gmailInput.focus();
    return;
  }

  emailError.textContent = "";

  const plan = selectedPlan();
  const method = selectedPayment();
  checkoutState.plan = plan;
  checkoutState.paymentMethod = method;
  checkoutState.email = gmail;
  checkoutState.transactionId = "";
  resetTransactionField();

  if (method === "paypal") {
    modalTitle.textContent = `Pay with PayPal - $${plan.price}`;
    modalText.textContent = `${plan.label} subscription for Email: ${gmail}`;
    transactionField.hidden = true;
    doneButton.hidden = true;
    paymentBox.innerHTML = `
      <strong>Live PayPal checkout</strong>
      <p>Click the PayPal button below. PayPal will open securely and charge $${plan.price} to the merchant account connected to this checkout.</p>
      <div id="paypalButtonContainer"></div>
    `;
  } else if (method === "usdt") {
    modalTitle.textContent = `${plan.label} subscription - $${plan.price}`;
    modalText.textContent = `Email: ${gmail}`;
    paymentBox.innerHTML = `
      <strong>USDT TRC20 payment</strong>
      <p>Amount: $${plan.price} USDT</p>
      <p>Network: TRC20</p>
      <p class="copy-line">${merchantPayment.usdtTrc20Address}</p>
      <p>Note: ${gmail}</p>
      <p>Paste your USDT transaction hash below after sending payment.</p>
    `;
  } else if (method === "usdt-bep20") {
    modalTitle.textContent = `${plan.label} subscription - $${plan.price}`;
    modalText.textContent = `Email: ${gmail}`;
    paymentBox.innerHTML = `
      <strong>USDT BEP20 payment</strong>
      <p>Amount: $${plan.price} USDT</p>
      <p>Network: BEP20 (BSC)</p>
      <p class="copy-line">${merchantPayment.usdtBep20Address}</p>
      <p>Note: ${gmail}</p>
      <p>Paste your USDT transaction hash below after sending payment.</p>
    `;
  } else if (method === "usdc-bep20") {
    modalTitle.textContent = `${plan.label} subscription - $${plan.price}`;
    modalText.textContent = `Email: ${gmail}`;
    paymentBox.innerHTML = `
      <strong>USDC BEP20 payment</strong>
      <p>Amount: $${plan.price} USDC</p>
      <p>Network: BEP20 (BSC)</p>
      <p class="copy-line">${merchantPayment.usdcBep20Address}</p>
      <p>Note: ${gmail}</p>
      <p>Paste your USDC transaction hash below after sending payment.</p>
    `;
  }

  sendOwnerEmailNotification({
    email: gmail,
    plan,
    paymentMethod: method,
    transactionId: "",
    stage: "Checkout started"
  });

  modal.showModal();
  if (method === "paypal") {
    renderPayPalButton(plan, gmail);
  }
  startPaymentTimer();
});

closeButton.addEventListener("click", () => modal.close());
modal.addEventListener("close", stopPaymentTimer);
transactionInput.addEventListener("input", () => {
  transactionError.textContent = "";
});
doneButton.addEventListener("click", () => {
  if (doneButton.dataset.submitted === "true") {
    modal.close();
    return;
  }

  const transactionId = transactionInput.value.trim();

  if (remainingPaymentSeconds <= 0) {
    transactionError.textContent = "Payment window expired. Close and start again.";
    return;
  }

  if (transactionId.length < 6) {
    transactionError.textContent = "Please enter a valid transaction ID or receipt number.";
    transactionInput.focus();
    return;
  }

  showSubmittedPayment(transactionId);
  modal.close();
  showPendingOverlay(transactionId);
});

if (pendingOverlayClose) {
  pendingOverlayClose.addEventListener("click", hidePendingOverlay);
}

if (failedOverlayClose) {
  failedOverlayClose.addEventListener("click", hideFailedOverlay);
}

updatePlanState();
updatePaymentState();
