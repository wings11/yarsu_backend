$controllers = @(
    'courseController.js',
    'travelController.js', 
    'highlightController.js',
    'linkController.js',
    'userController.js',
    'inquiryController.js',
    'chatController.js'
)

foreach ($controller in $controllers) {
    if (Test-Path $controller) {
        Write-Host "Updating $controller..."
        (Get-Content $controller) -replace 'import \{ supabase \} from', 'import { supabaseAdmin } from' | Set-Content $controller
        (Get-Content $controller) -replace 'await supabase', 'await supabaseAdmin' | Set-Content $controller
        Write-Host "Updated $controller"
    } else {
        Write-Host "File $controller not found"
    }
}
