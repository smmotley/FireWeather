from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from goesFire.models import Profile

class NewUserForm(UserCreationForm):
    # required = True means you can't fill out form without this.
    username = forms.CharField(required=False, max_length=30,
                             widget=forms.TextInput(attrs={'placeholder': 'Username'}))
    email = forms.EmailField(required=False,
                             widget=forms.TextInput(attrs={'placeholder':'Valid Email'}))
    first_name = forms.CharField(label="First Name", required=False,
                                 widget=forms.TextInput(attrs={'placeholder':'First Name'}))
    last_name = forms.CharField(label="Last Name", required=False,
                                widget=forms.TextInput(attrs={'placeholder': 'Last Name'}))

    def __str__(self):
        return f"{self.username}"

    def get_object(self, queryset=None):
        return self.request.user

    class Meta:
        model = User    # The basic django model we are using as our template here.
        fields = ("username", "first_name", "last_name", "email", "password1", "password2") # So, same as before, but now we're including email

    # When it gets saved, commit the data to the database
    def save(self, commit=True):
        user = super(NewUserForm, self).save(commit=False)  # Don't commit it yet until we modify the data.
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
        return user


class UserProfileForm(forms.ModelForm):
    error_messages =  {'Incorrect Format': ('The phone number was entered incorrectly.')}

    user_lat = forms.FloatField(label="Your Current Latitude", required=False,
                                 widget=forms.TextInput(attrs={'placeholder': 'Latitude'}))
    user_lng = forms.FloatField(label="Your Current Longitude", required=False,
                                widget=forms.TextInput(attrs={'placeholder': 'Longitude'}))
    fav1_desc = forms.CharField(label="Place 1 Description", required=False,
                                widget=forms.TextInput(attrs={'placeholder': 'Location Description'}))
    fav2_desc = forms.CharField(label="Place 2 Description", required=False,
                                widget=forms.TextInput(attrs={'placeholder': 'Location Description'}))

    class Meta:
        model = Profile
        fields = ("fav1_lat", "fav1_lng", "user_lat", "user_lng", "phone_number") # So, same as before, but now we're including email

class EditUserForm(forms.ModelForm):
    username = forms.CharField(disabled=True, widget=forms.TextInput(attrs={'style': 'cursor: not-allowed'}))
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email')

class UserLocationForm(forms.ModelForm):
    error_messages = {'Incorrect Format': ('The phone number was entered incorrectly.')}

    class Meta:
        model = Profile
        fields = ("user_lat", "user_lng", "user_radius", "userCords",
                  "fav1_lat", "fav1_lng", "fav1_radius", "fav1_desc",
                  "fav2_lat", "fav2_lng", "fav2_radius", "fav2_desc",
                  "phone_number") # So, same as before, but now we're including email


