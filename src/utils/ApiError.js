class ApiError extends Error{
constructor(
    statusCode,
    message="Somthing went wrong",
    errors=[],
    stack=''
){

    //overriding error class

    super(message);

    this.statusCode=statusCode;
    this.date=null;
    this.message=message;
    this.success=false;
    this.errors = errors;
//in production need to remove 
    if(stack){
        this.stack = stack;
    }else{
        Error.captureStackTrace(this,this.constructor);
    }

}

};
export {ApiError}