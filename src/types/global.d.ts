declare global {
    interface CustomError extends Error {
      status?: number;
    }
  }

  export { }