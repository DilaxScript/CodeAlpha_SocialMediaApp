from django.http import JsonResponse

def custom_404_handler(request, exception=None):
    """
    ✅ Custom 404 handler for API consistency
    """
    return JsonResponse({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested API endpoint does not exist.',
        'status_code': 404
    }, status=404)

def custom_500_handler(request):
    """
    ✅ Custom 500 handler for API consistency  
    """
    return JsonResponse({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred on the server.',
        'status_code': 500
    }, status=500)

def custom_400_handler(request, exception=None):
    """
    ✅ Custom 400 handler for bad requests
    """
    return JsonResponse({
        'success': False,
        'error': 'Bad request',
        'message': 'The request could not be processed.',
        'status_code': 400
    }, status=400)

def custom_403_handler(request, exception=None):
    """
    ✅ Custom 403 handler for permission denied
    """
    return JsonResponse({
        'success': False, 
        'error': 'Permission denied',
        'message': 'You do not have permission to access this resource.',
        'status_code': 403
    }, status=403)
