import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { UserService } from '../../services/user.service';
import axios from 'axios';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  existingUsernames: string[] = [];

  constructor(
    private fb: FormBuilder,
    private renderer: Renderer2,
    private modalService: ModalService,
    private userService: UserService 
  ) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, this.usernameValidator.bind(this)]],
      email: ['', [Validators.required, Validators.email, this.gmailValidator]],
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required, this.confirmPasswordValidator.bind(this)]],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.setInitialStyles();
    window.addEventListener('resize', this.applyBackground.bind(this));
    this.loadUsernames();
  }

  ngOnDestroy(): void {
    this.revertStyles();
    window.removeEventListener('resize', this.applyBackground.bind(this));
  }

  private loadUsernames(): void {
    this.userService.getUsernames().subscribe(
      (usernames) => {
        this.existingUsernames = usernames;
        console.log('Usernames loaded:', this.existingUsernames);
      },
      (error) => {
        console.error('Error fetching usernames:', error);
      }
    );
  }

  private setInitialStyles(): void {
    this.renderer.setStyle(document.body, 'height', '100%');
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.renderer.setStyle(document.body, 'display', 'flex');
    this.renderer.setStyle(document.body, 'justify-content', 'center');
    this.renderer.setStyle(document.body, 'align-items', 'center');
    this.renderer.setStyle(document.body, 'background', 'url("../../assets/signup_bg.png") center/cover no-repeat');
    
    this.renderer.setStyle(document.documentElement, 'height', '100%');
    this.renderer.setStyle(document.documentElement, 'overflow', 'hidden');
    this.applyBackground();
  }

  private revertStyles(): void {
    this.renderer.removeStyle(document.body, 'height');
    this.renderer.removeStyle(document.body, 'overflow');
    this.renderer.removeStyle(document.body, 'display');
    this.renderer.removeStyle(document.body, 'justify-content');
    this.renderer.removeStyle(document.body, 'align-items');
    this.renderer.removeStyle(document.body, 'background');
    
    this.renderer.removeStyle(document.documentElement, 'height');
    this.renderer.removeStyle(document.documentElement, 'overflow');
  }

  private applyBackground(): void {
    if (window.innerWidth <= 425) {
      this.renderer.setStyle(document.body, 'background', 'url("../../assets/signup_mbg.png") center/cover no-repeat');
    } else {
      this.renderer.setStyle(document.body, 'background', 'url("../../assets/signup_bg.png") center/cover no-repeat');
    }
  }

  private usernameValidator(control: AbstractControl): ValidationErrors | null {
    if (this.existingUsernames.includes(control.value)) {
      return { usernameTaken: true };
    }
    return null;
  }

  private gmailValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && !control.value.endsWith('@gmail.com')) {
      return { notGmail: true };
    }
    return null;
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    const errors: ValidationErrors = {};
    
    if (!/[A-Z]/.test(password)) {
      errors.noUpperCase = true;
    }
    if (!/[a-z]/.test(password)) {
      errors.noLowerCase = true;
    }
    if (!/[0-9]/.test(password)) {
      errors.noNumber = true;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.noSpecialChar = true;
    }
    if (password.length < 8) {
      errors.tooShort = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  private confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
    if (this.registrationForm && control.value !== this.registrationForm.get('password')?.value) {
      return { mismatch: true };
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    const url = "http://localhost:4000";
    if (this.registrationForm.valid) {
      console.log('Form Submitted', this.registrationForm.value);
      const signupUser = await axios.post(`${url}/api/signup`, this.registrationForm.value);
      if (signupUser.status === 201) {
        const sendEmail = await axios.post(`${url}/send/email`, {
          email: this.registrationForm.value.email
        });
        if (sendEmail.status === 200) {
          alert(sendEmail.data.msg);
        }
      }
    } else {
      console.log('Form is invalid');
    }
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'confirmPassword') {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

  openTermsModal(event: Event): void {
    event.preventDefault();
    this.modalService.openTermsModal();
  }

  getErrorMessage(controlName: string): string {
    const control = this.registrationForm.get(controlName);
    if (control && control.errors) {
      if (control.errors.required) {
        return `${this.capitalizeFirstLetter(controlName)} is required.`;
      } else if (control.errors.email) {
        return 'Email must be a valid email address.';
      } else if (control.errors.notGmail) {
        return 'Email must be a valid Google mail address.';
      } else if (control.errors.usernameTaken) {
        return 'Username is already taken.';
      } else if (control.errors.tooShort) {
        return 'Password must be at least 8 characters long.';
      } else if (control.errors.noUpperCase) {
        return 'Password must include at least one uppercase letter.';
      } else if (control.errors.noLowerCase) {
        return 'Password must include at least one lowercase letter.';
      } else if (control.errors.noNumber) {
        return 'Password must include at least one number.';
      } else if (control.errors.noSpecialChar) {
        return 'Password must include at least one special character.';
      } else if (control.errors.mismatch) {
        return 'Passwords must match.';
      }
    }
    return '';
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/([A-Z])/g, ' $1');
  }
}
