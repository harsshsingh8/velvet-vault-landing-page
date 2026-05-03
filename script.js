const planCards = document.querySelectorAll(".plan-card");
const paymentOptions = document.querySelectorAll(".pay-option");
const summaryPlan = document.querySelector("#summaryPlan");
const summaryPrice = document.querySelector("#summaryPrice");
const paymentHelp = document.querySelector("#paymentHelp");
const form = document.querySelector("#checkout");
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

const merchantPayment = {
  paypalClientId: "AaCi1aE_vOFlp3hyWA4CSiebcp37z5YaFDIEctTELT43J5O",
  paypalEmail: "harshsingh9993@gmail.com",
  usdtTrc20Address: "TTZsRB6LvEBZN5pNcCWu8qWK6o19rs19jB"
};

const paymentWindowSeconds = 15 * 60;
let paymentIntervalId;
let remainingPaymentSeconds = paymentWindowSeconds;

const paymentCopy = {
  paypal: "Continue to live PayPal checkout after confirming your Gmail ID.",
  usdt: "Send USDT on TRC20 and include your Gmail ID in the payment note."
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

  paymentHelp.textContent = paymentCopy[selectedPayment()];
}

function isGmail(value) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value.trim());
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
  transactionError.textContent = "";
  doneButton.textContent = "Submit payment details";
  doneButton.dataset.submitted = "false";
}

function showSubmittedPayment(transactionId) {
  stopPaymentTimer();
  modalTitle.textContent = "Payment details submitted";
  modalText.textContent = "Your transaction ID has been captured in this browser session.";
  paymentBox.innerHTML = `
    <strong>Submitted transaction</strong>
    <p class="copy-line">${transactionId}</p>
    <p>Keep this ID safe for payment verification.</p>
  `;
  transactionInput.value = transactionId;
  transactionInput.disabled = true;
  doneButton.textContent = "Close";
  doneButton.dataset.submitted = "true";
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

  emailError.textContent = "Please enter a valid Gmail address ending in @gmail.com.";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const gmail = gmailInput.value.trim();
  if (!isGmail(gmail)) {
    emailError.textContent = "A Gmail ID is required before payment.";
    gmailInput.focus();
    return;
  }

  const plan = selectedPlan();
  const method = selectedPayment();
  modalTitle.textContent = `${plan.label} subscription - $${plan.price}`;
  modalText.textContent = `Gmail ID: ${gmail}`;
  resetTransactionField();

  if (method === "paypal") {
    paymentBox.innerHTML = `
      <strong>Live PayPal checkout</strong>
      <p>Pay $${plan.price} to ${merchantPayment.paypalEmail}. PayPal will open securely here and fill the transaction ID after successful payment.</p>
      <div id="paypalButtonContainer"></div>
    `;
  } else {
    paymentBox.innerHTML = `
      <strong>USDT TRC20 payment</strong>
      <p>Amount: $${plan.price} USDT</p>
      <p>Network: TRC20</p>
      <p class="copy-line">${merchantPayment.usdtTrc20Address}</p>
      <p>Note: ${gmail}</p>
      <p>Paste your USDT transaction hash below after sending payment.</p>
    `;
  }

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
});
updatePlanState();
updatePaymentState();
