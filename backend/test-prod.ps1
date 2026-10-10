$ErrorActionPreference = 'Stop'
$baseUrl = "https://smart-parking-backend-jt7b.onrender.com"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "prodtest_$timestamp@example.com"
$password = "TestPass123!"
$name = "Prod Tester"

Write-Host "1. Testing signup on Render backend..."
$signupBody = @{ name = $name; email = $email; password = $password } | ConvertTo-Json
$signupRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
Write-Host "   Signup OK: ID = $($signupRes.id), Email = $($signupRes.email)"

Write-Host "2. Testing login on Render backend..."
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
Write-Host "   Login OK: Got token length $($token.Length)"

$headers = @{ Authorization = "Bearer $token" }

Write-Host "3. Testing /api/users/me on Render backend..."
$me = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method Get -Headers $headers
Write-Host "   /me OK: $($me.name) ($($me.email)) Role: $($me.role)"

Write-Host "4. Testing parking slot availability on Render backend..."
$avail = Invoke-RestMethod -Uri "$baseUrl/api/parking-slots/availability" -Method Get -Headers $headers
Write-Host "   Availability OK: Total = $($avail.total), Free = $($avail.available), Occupied = $($avail.occupied)"

Write-Host "5. Testing vehicle registration on Render backend..."
$vehNumber = "KA05" + [char](65 + [int]($timestamp % 26)) + [char](65 + [int](($timestamp / 26) % 26)) + ($timestamp % 10000).ToString("0000")
$vehBody = @{ vehicleNumber = $vehNumber; vehicleType = "CAR"; brand = "Toyota"; model = "Camry" } | ConvertTo-Json
$vehRes = Invoke-RestMethod -Uri "$baseUrl/api/vehicles" -Method Post -Headers $headers -Body $vehBody -ContentType "application/json"
$vehicleId = $vehRes.id
Write-Host "   Vehicle OK: ID = $vehicleId, Number = $($vehRes.vehicleNumber)"

Write-Host "6. Finding compatible slot on Render backend..."
$slot = Invoke-RestMethod -Uri "$baseUrl/api/parking-slots/find?vehicleType=CAR" -Method Get -Headers $headers
$slotId = $slot.id
Write-Host "   Compatible slot OK: ID = $slotId, SlotNumber = $($slot.slotNumber), Size = $($slot.size)"

Write-Host "7. Testing check-in on Render backend..."
$checkInBody = @{ vehicleId = $vehicleId; parkingSlotId = $slotId } | ConvertTo-Json
$session = Invoke-RestMethod -Uri "$baseUrl/api/parking-sessions/check-in" -Method Post -Headers $headers -Body $checkInBody -ContentType "application/json"
$sessionId = $session.id
Write-Host "   Check-in OK: Session ID = $sessionId, Status = $($session.status)"

Write-Host "8. Testing check-out with UPI payment on Render backend..."
$checkoutBody = @{ paymentMethod = "UPI" } | ConvertTo-Json
$completed = Invoke-RestMethod -Uri "$baseUrl/api/parking-sessions/$sessionId/check-out" -Method Post -Headers $headers -Body $checkoutBody -ContentType "application/json"
Write-Host "   Check-out OK: Status = $($completed.status), Fee = INR $($completed.fee), PaymentStatus = $($completed.paymentStatus), PaymentRef = $($completed.paymentReference)"

Write-Host "RENDER PRODUCTION BACKEND VERIFICATION COMPLETE & PASSED!" -ForegroundColor Green
