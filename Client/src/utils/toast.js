import hotToast from "react-hot-toast";

const defaultOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "10px",
    padding: "12px 16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};

export function success(message, options = {}) {
  return hotToast.success(message, { ...defaultOptions, ...options });
}

export function error(message, options = {}) {
  return hotToast.error(message, {
    ...defaultOptions,
    duration: 5000,
    ...options,
  });
}

const toast = {
  success,
  error,
};

export default toast;
