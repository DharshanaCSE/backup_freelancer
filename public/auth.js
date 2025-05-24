document.addEventListener('DOMContentLoaded', () => {
    // Email validation function
    function validateEmail(email) {
        // Regular expression for email validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address. Example: username@domain.com'
            };
        }

        // Additional validation for specific parts
        const [localPart, domain] = email.split('@');
        
        // Check local part
        if (localPart.length > 64) {
            return {
                isValid: false,
                message: 'Local part of email cannot exceed 64 characters'
            };
        }

        // Check domain
        if (domain.length > 255) {
            return {
                isValid: false,
                message: 'Domain part of email cannot exceed 255 characters'
            };
        }

        // Check TLD
        const tld = domain.split('.').pop();
        if (tld.length < 2 || tld.length > 6) {
            return {
                isValid: false,
                message: 'Invalid top-level domain'
            };
        }

        return { isValid: true };
    }

    // Handle user type selection in registration
    const typeButtons = document.querySelectorAll('.type-btn');
    const freelancerFields = document.getElementById('freelancerFields');
    const employerFields = document.getElementById('employerFields');

    if (typeButtons.length > 0) {
        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                typeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const categoryField = document.getElementById('category');
                console.log('User type selected:', button.dataset.type);
                if (button.dataset.type === 'freelancer') {
                    freelancerFields.style.display = 'block';
                    employerFields.style.display = 'none';
                    if (categoryField) {
                        categoryField.removeAttribute('required');
                        categoryField.disabled = true;
                        categoryField.style.display = 'none';
                        console.log('Category field hidden, disabled, and not required for freelancer');
                    }
                } else {
                    freelancerFields.style.display = 'none';
                    employerFields.style.display = 'block';
                    if (categoryField) {
                        categoryField.setAttribute('required', 'required');
                        categoryField.disabled = false;
                        categoryField.style.display = '';
                        console.log('Category field shown, enabled, and required for employer');
                    }
                }
            });
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Validate email
            const emailValidation = validateEmail(email);
            if (!emailValidation.isValid) {
                showError(loginForm, emailValidation.message);
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store token in localStorage
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('appliedJobIds', '[]');
                    }
                    // Redirect based on user type
                    if (data.userType === 'freelancer') {
                        window.location.href = '/freelancer-home.html';
                    } else {
                        window.location.href = '/employer-home.html';
                    }
                } else {
                    showError(loginForm, data.message);
                }
            } catch (error) {
                showError(loginForm, 'An error occurred. Please try again.');
            }
        });
    }

    // Handle registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoryField = document.getElementById('category');
            console.log('On submit: category field required:', categoryField?.required, 'disabled:', categoryField?.disabled, 'display:', categoryField?.style.display);

            const email = document.getElementById('email').value;
            
            // Validate email
            const emailValidation = validateEmail(email);
            if (!emailValidation.isValid) {
                showError(registerForm, emailValidation.message);
                return;
            }

            const userType = document.querySelector('.type-btn.active').dataset.type;
            const formData = {
                username: document.getElementById('username').value,
                email: email,
                password: document.getElementById('password').value,
                userType
            };

            // Add type-specific fields
            if (userType === 'freelancer') {
                formData.domain = document.getElementById('domain').value;
                formData.skills = document.getElementById('skills').value;
                formData.profile = document.getElementById('profile').value;
                formData.portfolio = document.getElementById('portfolio').value;
                let experienceVal = document.getElementById('experience').value;
                experienceVal = experienceVal === '' ? 0 : parseInt(experienceVal, 10);
                if (isNaN(experienceVal) || experienceVal < 0) experienceVal = 0;
                formData.experience = experienceVal;
            } else {
                formData.companyName = document.getElementById('companyName').value;
                formData.companyDescription = document.getElementById('companyDescription').value;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Store token in localStorage
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('appliedJobIds', '[]');
                    }
                    // Redirect based on user type
                    if (userType === 'freelancer') {
                        window.location.href = '/freelancer-home.html';
                    } else {
                        window.location.href = '/employer-home.html';
                    }
                } else {
                    showError(registerForm, data.message);
                }
            } catch (error) {
                showError(registerForm, 'An error occurred. Please try again.');
            }
        });
    }
});

function showError(form, message) {
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);
} 