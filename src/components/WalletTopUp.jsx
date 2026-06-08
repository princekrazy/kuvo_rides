import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useNavigate } from "react-router-dom";
import { capturePaypalOrder, createPaypalOrder } from "../api";

export default function WalletTopUp() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(20);
  const [amount, setAmount] = useState("");
  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet");
    if (storedWallet !== null) {
      setWallet(storedWallet);
    }
  }, []);
  const driver_id = localStorage.getItem("driver_id");

  const value = Number(amount);

  return (
    <PayPalScriptProvider
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <div style={styles.page}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Wallet Top-Up</h1>
            <p style={styles.subtitle}>Add funds securely via PayPal</p>
          </div>

          {/* Balance */}
          <div style={styles.balanceCard}>
            <p style={styles.balanceLabel}>Current Balance</p>
            <p style={styles.balanceAmount}>${wallet}</p>
          </div>
          <div style={styles.backWrapper}>
            <button
              onClick={() => navigate("/driverhome")}
              style={styles.backButton}
            >
              Back
            </button>
          </div>

          {/* Input */}
          <div style={styles.section}>
            <label style={styles.label}>Enter Amount</label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10"
              style={styles.input}
            />

            {value > 0 && (
              <p style={styles.previewText}>
                You will add <b>${value}</b> to your wallet
              </p>
            )}
          </div>

          {/* PayPal */}
          {value > 0 && (
            <div style={styles.paypalBox}>
              <PayPalButtons
                style={{
                  layout: "vertical",
                  shape: "rect",
                }}
                createOrder={async () => {
                  const token = localStorage.getItem("driver_token");

                  const res = await createPaypalOrder(value, token);
                  const data = res.data;

                  return data.orderID;
                }}
                onApprove={async (data) => {
                  const token = localStorage.getItem("driver_token");

                  const res = await capturePaypalOrder(
                    data.orderID,
                    driver_id,
                    token,
                  );
                  const result = res.data;

                  if (result.success) {
                    setWallet(result.amount);
                    localStorage.setItem("wallet", result.amount);
                    alert(`Wallet topped up: $${result.amount}`);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },

  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  backButton: {
    marginBottom: "12px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontWeight: "600",
  },
  backWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    margin: "0",
    color: "#111",
  },

  subtitle: {
    fontSize: "13px",
    color: "#666",
    marginTop: "6px",
  },

  balanceCard: {
    backgroundColor: "#f9fafb",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
    marginBottom: "20px",
  },

  balanceLabel: {
    fontSize: "12px",
    color: "#777",
    margin: 0,
  },

  balanceAmount: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#16a34a",
    margin: "6px 0 0 0",
  },

  section: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    marginBottom: "6px",
    color: "#444",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    outline: "none",
    fontSize: "14px",
  },

  previewText: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#555",
  },

  paypalBox: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "12px",
  },
};
