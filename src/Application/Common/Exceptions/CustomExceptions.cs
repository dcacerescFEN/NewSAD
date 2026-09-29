namespace Application.Common.Exceptions;

public class NotFoundException(string message) : Exception(message);
public class ForbiddenAccessException(string message) : Exception(message);
public class ArgumentException(string message) : Exception(message);