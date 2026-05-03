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

const merchantPayment = {
  paypalUrl: "https://www.paypal.com/paypalme/YourProfile",
  usdtTrc20Address: "TX7p9ReplaceWithYourUSDTWalletAddress"
};

const paymentCopy = {
  paypal: "Continue to PayPal after confirming your Gmail ID.",
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

  if (method === "paypal") {
    paymentBox.innerHTML = `
      <strong>PayPal payment</strong>
      <p>Send $${plan.price} using PayPal and include ${gmail} in the payment note.</p>
      <a class="primary-button" href="${merchantPayment.paypalUrl}" target="_blank" rel="noopener">Open PayPal</a>
    `;
  } else {
    paymentBox.innerHTML = `
      <strong>USDT TRC20 payment</strong>
      <p>Amount: $${plan.price} USDT</p>
      <p>Wallet: ${merchantPayment.usdtTrc20Address}</p>
      <p>Note: ${gmail}</p>
    `;
  }

  modal.showModal();
});

closeButton.addEventListener("click", () => modal.close());
doneButton.addEventListener("click", () => modal.close());
updatePlanState();
updatePaymentState();
