$(document).ready(function () {
    lucide.createIcons();

    var userEmail = $('#Email').val();
    console.log(userEmail);

    $.ajax({
        url: '/authority/SendOTP',
        type: 'GET',
        data: { Username: userEmail },
        success: function (response) {
            console.log('OTP verification page loaded successfully.');
        },
        error: function (err) {
            console.log(err);
        }
    })

    const $otpInputs = $('.otp-input');
    const $resendButton = $('#resendCode');
    const $countdown = $('#countdown');
    let resendTimer = 60;

    $otpInputs.each(function (index, input) {
        $(input).on('input', function () {
            let value = $(this).val();
            if (!/^\d$/.test(value)) {
                $(this).val('');
                return;
            }
            if (value && index < $otpInputs.length - 1) {
                $otpInputs.eq(index + 1).focus();
            }
        });

        $(input).on('keydown', function (e) {
            if (e.key === 'Backspace' && !$(this).val() && index > 0) {
                $otpInputs.eq(index - 1).focus();
            }
        });

        $(input).on('paste', function (e) {
            e.preventDefault();
            const paste = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/\D/g, '').slice(0, 6);
            digits.split('').forEach(function (digit, i) {
                if ($otpInputs[i]) {
                    $otpInputs.eq(i).val(digit);
                }
            });
            if (digits.length > 0) {
                $otpInputs.eq(Math.min(digits.length - 1, 5)).focus();
            }
        });
    });

    $('#otpForm').on('submit', function (e) {
        e.preventDefault();
        let otp = '';
        $otpInputs.each(function () {
            otp += $(this).val();
        });

        if (otp.length !== 6) {
            alert('Please enter the complete 6-digit code.');
            return;
        }

        $.ajax({
            url: '/Authority/VerifyOtp',
            type: 'POST', 
            data: { inputOtp: otp, username: userEmail },
            success: function (response) {
                if (response.success && response.redirectTo) {
                    window.location.href = response.redirectTo;
                } else {
                    alert(response.message || 'OTP verification failed.');
                }
            },
            error: function (err) {
                console.error(err);
                alert('An error Verify Otp.');
            }
        });
    });

    function startCountdown() {
        $resendButton.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');

        const timer = setInterval(function () {
            $countdown.text(`Resend available in ${resendTimer}s`);
            resendTimer--;

            if (resendTimer < 0) {
                clearInterval(timer);
                $resendButton.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                $countdown.text('');
                resendTimer = 60;
            }
        }, 1000);
    }

    $resendButton.on('click', function () {
        $.ajax({
            url: '/Authority/VerifyOtp',
            type: 'POST',
            data: { inputOtp: otp, username: userEmail },
            success: function (response) {
                if (response.success) {
                    alert('New verification code sent!');
                    startCountdown();
                } else {
                    alert('Failed to send OTP. Try again.');
                }
            },
            error: function (err) {
                console.error(err);
                alert('An error occurred while resending OTP.');
            }
        });
    });

    startCountdown();

    $otpInputs.eq(0).focus();

});