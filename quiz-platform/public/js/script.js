// Client-side JavaScript for additional functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add any client-side functionality you need
    console.log('Quiz Platform loaded');
    
    // Enable Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
