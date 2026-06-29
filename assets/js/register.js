/**
 * Complaint Management Portal — Registration Page
 * Citizen account creation with OTP verification, password strength, and LocalStorage.
 */

(function () {
    'use strict';

    const { CMP } = window;

    const OTP_DURATION = 60;
    const DEMO_OTP = '123456';

    let otpVerified = false;
    let otpSent = false;
    let otpTimer = null;
    let otpCountdown = 0;

    /* DOM References */
    const registerForm = document.getElementById('register-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const otpInput = document.getElementById('otp');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const registerBtn = document.getElementById('register-btn');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirm = document.getElementById('toggle-confirm');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const nameCounter = document.getElementById('name-counter');
    const otpHint = document.getElementById('otp-hint');

    const fields = {
        name: { input: fullNameInput, group: document.getElementById('name-group'), error: document.getElementById('name-error') },
        email: { input: emailInput, group: document.getElementById('email-group'), error: document.getElementById('email-error') },
        phone: { input: phoneInput, group: document.getElementById('phone-group'), error: document.getElementById('phone-error') },
        otp: { input: otpInput, group: document.getElementById('otp-group'), error: document.getElementById('otp-error') },
        password: { input: passwordInput, group: document.getElementById('password-group'), error: document.getElementById('password-error') },
        confirm: { input: confirmInput, group: document.getElementById('confirm-group'), error: document.getElementById('confirm-error') }
    };

    /* ----------------------------------------------------------
       Initialization
    ---------------------------------------------------------- */
    function init() {
        CMP.initTheme();
        CMP.seedDefaultUsers();

        const session = CMP.getSession();
        if (session) {
            window.location.href = CMP.getRedirectUrl(session.role);
            return;
        }

        initCharCounter();
        initPasswordToggle();
        initPasswordStrength();
        initOtp();
        initValidation();
        initSubmit();
    }

    /* ----------------------------------------------------------
       Character Counter
    ---------------------------------------------------------- */
    function initCharCounter() {
        fullNameInput?.addEventListener('input', () => {
            const len = fullNameInput.value.length;
            nameCounter.textContent = `${len} / 80`;
            nameCounter.classList.toggle('limit-near', len >= 70);
        });
    }

    /* ----------------------------------------------------------
       Password Visibility
    ---------------------------------------------------------- */
    function bindToggle(btn, input) {
        btn?.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = btn.querySelector('i');
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    }

    function initPasswordToggle() {
        bindToggle(togglePassword, passwordInput);
        bindToggle(toggleConfirm, confirmInput);
    }

    /* ----------------------------------------------------------
       Password Strength Meter
    ---------------------------------------------------------- */
    function getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (!password) return { level: 0, label: 'Password strength', class: '' };
        if (score <= 1) return { level: 1, label: 'Weak', class: 'weak' };
        if (score <= 2) return { level: 2, label: 'Fair', class: 'fair' };
        if (score <= 3) return { level: 3, label: 'Good', class: 'good' };
        return { level: 4, label: 'Strong', class: 'strong' };
    }

    function initPasswordStrength() {
        passwordInput?.addEventListener('input', () => {
            const { level, label, class: cls } = getPasswordStrength(passwordInput.value);
            strengthFill.style.width = `${level * 25}%`;
            strengthFill.className = `strength-fill ${cls}`;
            strengthText.textContent = label;
            strengthText.className = `strength-text ${cls}`;
        });
    }

    /* ----------------------------------------------------------
       OTP Timer & Verification
    ---------------------------------------------------------- */
    function initOtp() {
        phoneInput?.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
            if (otpSent) resetOtp();
        });

        sendOtpBtn?.addEventListener('click', handleSendOtp);

        otpInput?.addEventListener('input', () => {
            otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
            clearFieldError('otp');

            if (otpInput.value.length === 6) {
                verifyOtp(otpInput.value);
            }
        });
    }

    function handleSendOtp() {
        const phoneErr = validatePhone(phoneInput.value);
        setFieldError('phone', phoneErr);

        if (phoneErr) {
            phoneInput.focus();
            CMP.showToast(phoneErr, 'error');
            return;
        }

        otpSent = true;
        otpVerified = false;
        otpInput.disabled = false;
        otpInput.value = '';
        otpInput.focus();

        CMP.showToast(`OTP sent to +91 ${phoneInput.value}. Demo code: ${DEMO_OTP}`, 'info', 6000);
        otpHint.textContent = `Demo OTP: ${DEMO_OTP} — Enter the 6-digit code above.`;

        startOtpTimer();
    }

    function startOtpTimer() {
        otpCountdown = OTP_DURATION;
        sendOtpBtn.disabled = true;
        updateOtpButtonText();

        otpTimer = setInterval(() => {
            otpCountdown--;
            updateOtpButtonText();

            if (otpCountdown <= 0) {
                clearInterval(otpTimer);
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = 'Resend OTP';
            }
        }, 1000);
    }

    function updateOtpButtonText() {
        sendOtpBtn.textContent = otpCountdown > 0 ? `Resend (${otpCountdown}s)` : 'Resend OTP';
    }

    function verifyOtp(code) {
        if (code === DEMO_OTP) {
            otpVerified = true;
            setFieldSuccess('otp');
            CMP.showToast('Phone number verified successfully.', 'success');
        } else {
            otpVerified = false;
            setFieldError('otp', 'Invalid OTP. Please try again.');
        }
    }

    function resetOtp() {
        otpSent = false;
        otpVerified = false;
        otpInput.value = '';
        otpInput.disabled = true;
        clearInterval(otpTimer);
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
        otpHint.textContent = 'Click "Send OTP" to receive a verification code on your phone.';
        clearFieldError('otp');
    }

    /* ----------------------------------------------------------
       Validation Helpers
    ---------------------------------------------------------- */
    function validateName(value) {
        const trimmed = value.trim();
        if (!trimmed) return 'Full name is required.';
        if (trimmed.length < 2) return 'Name must be at least 2 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return 'Name contains invalid characters.';
        return '';
    }

    function validateEmail(value) {
        const trimmed = value.trim();
        if (!trimmed) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';

        const users = CMP.getUsers();
        if (users.some((u) => u.email.toLowerCase() === trimmed.toLowerCase())) {
            return 'This email is already registered.';
        }
        return '';
    }

    function validatePhone(value) {
        const digits = value.replace(/\D/g, '');
        if (!digits) return 'Phone number is required.';
        if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a valid 10-digit Indian mobile number.';
        return '';
    }

    function validatePassword(value) {
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.';
        if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter.';
        if (!/\d/.test(value)) return 'Include at least one number.';
        if (!/[^a-zA-Z0-9]/.test(value)) return 'Include at least one special character.';
        return '';
    }

    function validateConfirm(password, confirm) {
        if (!confirm) return 'Please confirm your password.';
        if (password !== confirm) return 'Passwords do not match.';
        return '';
    }

    function setFieldError(key, message) {
        const f = fields[key];
        if (!f) return;
        if (message) {
            f.group?.classList.add('error');
            f.group?.classList.remove('success');
            f.error.textContent = message;
            f.input?.setAttribute('aria-invalid', 'true');
        } else {
            clearFieldError(key);
        }
    }

    function setFieldSuccess(key) {
        const f = fields[key];
        f.group?.classList.remove('error');
        f.group?.classList.add('success');
        f.error.textContent = '';
        f.input?.setAttribute('aria-invalid', 'false');
    }

    function clearFieldError(key) {
        const f = fields[key];
        f.group?.classList.remove('error', 'success');
        f.error.textContent = '';
        f.input?.setAttribute('aria-invalid', 'false');
    }

    function initValidation() {
        Object.keys(fields).forEach((key) => {
            fields[key].input?.addEventListener('input', () => clearFieldError(key));
        });

        fullNameInput?.addEventListener('blur', () => {
            const err = validateName(fullNameInput.value);
            if (err) setFieldError('name', err);
        });

        emailInput?.addEventListener('blur', () => {
            const err = validateEmail(emailInput.value);
            if (err) setFieldError('email', err);
        });

        phoneInput?.addEventListener('blur', () => {
            const err = validatePhone(phoneInput.value);
            if (err) setFieldError('phone', err);
        });

        confirmInput?.addEventListener('blur', () => {
            const err = validateConfirm(passwordInput.value, confirmInput.value);
            if (err) setFieldError('confirm', err);
        });
    }

    /* ----------------------------------------------------------
       Form Submit
    ---------------------------------------------------------- */
    function initSubmit() {
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const errors = {
                name: validateName(fullNameInput.value),
                email: validateEmail(emailInput.value),
                phone: validatePhone(phoneInput.value),
                password: validatePassword(passwordInput.value),
                confirm: validateConfirm(passwordInput.value, confirmInput.value)
            };

            if (!otpSent) {
                setFieldError('otp', 'Please verify your phone number with OTP.');
            } else if (!otpVerified) {
                setFieldError('otp', 'Please enter a valid OTP to verify your phone.');
            } else {
                clearFieldError('otp');
            }

            Object.keys(errors).forEach((key) => setFieldError(key, errors[key]));

            const termsError = document.getElementById('terms-error');
            if (!termsCheckbox.checked) {
                termsError.textContent = 'You must agree to the Terms of Service.';
            } else {
                termsError.textContent = '';
            }

            const hasErrors = Object.values(errors).some(Boolean) || !termsCheckbox.checked || !otpVerified;

            if (hasErrors) {
                CMP.showToast('Please fix all errors before registering.', 'error');
                const firstKey = Object.keys(errors).find((k) => errors[k]);
                if (firstKey) fields[firstKey].input?.focus();
                else if (!otpVerified) otpInput?.focus();
                return;
            }

            setLoading(true);
            await new Promise((r) => setTimeout(r, 1000));

            const newUser = {
                id: CMP.generateUserId(),
                name: fullNameInput.value.trim(),
                email: emailInput.value.trim().toLowerCase(),
                password: passwordInput.value,
                phone: phoneInput.value.replace(/\D/g, ''),
                role: 'citizen',
                createdAt: new Date().toISOString()
            };

            const users = CMP.getUsers();
            users.push(newUser);
            CMP.saveUsers(users);

            CMP.setSession(newUser, true);
            CMP.showToast(`Welcome, ${newUser.name}! Your account has been created.`, 'success');

            setTimeout(() => {
                window.location.href = 'citizen/index.html';
            }, 800);
        });
    }

    function setLoading(loading) {
        registerBtn.disabled = loading;
        registerBtn.classList.toggle('loading', loading);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
