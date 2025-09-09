const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    res.status(err.statusCode || 500).json({
      success: false,
      code: err.code,
      message: err.message || "Server Error",
    });
  };
  
  export default errorHandler;
  
