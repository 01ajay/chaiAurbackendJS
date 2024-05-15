class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    console.log("Data=>",data);
    this.data = data;
    this.message = message;
    this.success = statusCode < 100;
  }

  
}

export {ApiResponse}
