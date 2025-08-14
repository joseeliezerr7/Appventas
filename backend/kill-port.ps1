$port = 3001
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "Found processes using port $port"
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Killing process: $($process.Name) (PID: $($process.Id))"
            Stop-Process -Id $process.Id -Force
        }
    }
    Write-Host "All processes using port $port have been terminated"
} else {
    Write-Host "No processes found using port $port"
}
