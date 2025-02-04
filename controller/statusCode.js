
const StatusCodes = Object.freeze({
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  });
  
  const Messages = Object.freeze({
    USER_NOT_LOGGED_IN: 'User not logged in.',
    INVALID_REQUEST: 'The request is invalid.',
    UNAUTHORIZED_ACCESS: 'Unauthorized access.',
    RESOURCE_NOT_FOUND: 'Resource not found.',
    INTERNAL_ERROR: 'An internal server error occurred.',
     ALL_FIELDS_REQUIRED: 'All fields are required.'
  });
  


  module.exports = {StatusCodes,Messages};
  