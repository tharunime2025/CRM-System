
document.addEventListener('DOMContentLoaded', () => {
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');

  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  // Toggle overlay panels
  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
  });

  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
  });

  // SIGN UP
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
      alert('Please fill all fields!');
      return;
    }

    const user = { name, email, password };
    localStorage.setItem('user', JSON.stringify(user));

    alert('Account created successfully! Please login.');
    signupForm.reset();
    container.classList.remove('right-panel-active');
  });

  // LOGIN
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const savedUser = JSON.parse(localStorage.getItem('user'));

    if (savedUser && email === savedUser.email && password === savedUser.password) {
      window.location.href = 'index.html'; // redirect to dashboard
    } else {
      alert('Invalid email or password!');
    }
  });
});

function searchFunction() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const items = document.querySelectorAll('.content-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(input)) {
            item.style.display = 'block'; // show
        } else {
            item.style.display = 'none'; // hide
        }
    });
}






