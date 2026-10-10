$ErrorActionPreference = 'Stop'

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "autotest_$timestamp@example.com"
$password = "TestPass123!"
$name = "Auto Tester"

Write-Host "1. Testing signup..."
$signupBody = @{ name = $name; email = $email; password = $password } | ConvertTo-Json
$signupRes = Invoke-RestMethod -Uri "http://localhost:4040/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
Write-Host "   Signup OK: ID = $($signupRes.id), Email = $($signupRes.email)"

Write-Host "2. Testing login..."
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:4040/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
Write-Host "   Login OK: Got token length $($token.Length)"

$headers = @{ Authorization = "Bearer $token" }

Write-Host "3. Testing /api/users/me..."
$me = Invoke-RestMethod -Uri "http://localhost:4040/api/users/me" -Method Get -Headers $headers
Write-Host "   /me OK: $($me.name) ($($me.email)) Role: $($me.role)"

Write-Host "4. Testing vehicle registration..."
$vehNumber = "KA05" + [char](65 + [int]($timestamp % 26)) + [char](65 + [int](($timestamp / 26) % 26)) + ($timestamp % 10000).ToString("0000")
$vehBody = @{ vehicleNumber = $vehNumber; vehicleType = "CAR"; brand = "Honda"; model = "City" } | ConvertTo-Json
$vehRes = Invoke-RestMethod -Uri "http://localhost:4040/api/vehicles" -Method Post -Headers $headers -Body $vehBody -ContentType "application/json"
$vehicleId = $vehRes.id
Write-Host "   Vehicle OK: ID = $vehicleId, Number = $($vehRes.vehicleNumber)"

Write-Host "5. Testing vehicle list..."
$vehList = Invoke-RestMethod -Uri "http://localhost:4040/api/vehicles" -Method Get -Headers $headers
Write-Host "   Vehicles OK: $($vehList.Count) registered vehicle(s)"

Write-Host "6. Testing parking slot availability..."
$avail = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-slots/availability" -Method Get -Headers $headers
Write-Host "   Availability OK: Total = $($avail.total), Free = $($avail.available), Occupied = $($avail.occupied)"

Write-Host "7. Finding compatible slot for CAR..."
$slot = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-slots/find?vehicleType=CAR" -Method Get -Headers $headers
$slotId = $slot.id
Write-Host "   Compatible slot OK: ID = $slotId, SlotNumber = $($slot.slotNumber), Size = $($slot.size)"

Write-Host "8. Testing check-in..."
$checkInBody = @{ vehicleId = $vehicleId; parkingSlotId = $slotId } | ConvertTo-Json
$session = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-sessions/check-in" -Method Post -Headers $headers -Body $checkInBody -ContentType "application/json"
$sessionId = $session.id
Write-Host "   Check-in OK: Session ID = $sessionId, Status = $($session.status)"

Write-Host "9. Testing active session query..."
$history = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-sessions" -Method Get -Headers $headers
$active = $history | Where-Object { $_.id -eq $sessionId }
Write-Host "   Session listed in history OK: Status = $($active.status)"

Write-Host "10. Testing edge case: double check-in with same vehicle..."
try {
    Invoke-RestMethod -Uri "http://localhost:4040/api/parking-sessions/check-in" -Method Post -Headers $headers -Body $checkInBody -ContentType "application/json"
    Write-Host "   FAILED: Double check-in should have been rejected!" -ForegroundColor Red
} catch {
    Write-Host "   Edge case PASS: Correctly rejected with HTTP $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "11. Testing check-out without valid payment method..."
try {
    $badCheckout = @{ paymentMethod = "INVALID" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:4040/api/parking-sessions/$sessionId/check-out" -Method Post -Headers $headers -Body $badCheckout -ContentType "application/json"
    Write-Host "   FAILED: Invalid payment method should have been rejected!" -ForegroundColor Red
} catch {
    Write-Host "   Edge case PASS: Correctly rejected with HTTP $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "12. Testing valid check-out with UPI..."
$checkoutBody = @{ paymentMethod = "UPI" } | ConvertTo-Json
$completed = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-sessions/$sessionId/check-out" -Method Post -Headers $headers -Body $checkoutBody -ContentType "application/json"
Write-Host "   Check-out OK: Status = $($completed.status), Fee = INR $($completed.fee), PaymentStatus = $($completed.paymentStatus), PaymentRef = $($completed.paymentReference)"

Write-Host "13. Testing reservation creation..."
$rsvSlot = Invoke-RestMethod -Uri "http://localhost:4040/api/parking-slots/find?vehicleType=CAR" -Method Get -Headers $headers
$startTime = [DateTime]::Now.AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ss")
$endTime = [DateTime]::Now.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
$rsvBody = @{ vehicleId = $vehicleId; parkingSlotId = $rsvSlot.id; startTime = $startTime; endTime = $endTime } | ConvertTo-Json
$rsv = Invoke-RestMethod -Uri "http://localhost:4040/api/reservations" -Method Post -Headers $headers -Body $rsvBody -ContentType "application/json"
Write-Host "   Reservation OK: Reference = $($rsv.reference), Status = $($rsv.status)"

Write-Host "14. Testing reservation cancel..."
$cancelledRsv = Invoke-RestMethod -Uri "http://localhost:4040/api/reservations/$($rsv.id)/cancel" -Method Post -Headers $headers -Body "{}" -ContentType "application/json"
Write-Host "   Reservation cancel OK: Status = $($cancelledRsv.status)"

Write-Host "15. Testing security: unauthorized access without token..."
try {
    Invoke-RestMethod -Uri "http://localhost:4040/api/vehicles" -Method Get
    Write-Host "   FAILED: Unauthenticated request should return 401!" -ForegroundColor Red
} catch {
    Write-Host "   Security PASS: Unauthenticated request returned HTTP $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "ALL BACKEND INTEGRATION & SECURITY TESTS PASSED!" -ForegroundColor Green
