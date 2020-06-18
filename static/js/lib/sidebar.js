const container = document.createElement('div');

export default function(content) {
  container.classList.add('sidebar');
  container.innerHTML = content;

  document.body.appendChild(container);

  const toggleButton = document.createElement('button');
  const icon = document.createElement('i');

  icon.innerHTML = 'info_outline';

  icon.classList.add('material-icons');
  toggleButton.classList.add('toggle-button');

  toggleButton.appendChild(icon);
  document.body.appendChild(toggleButton);

  let sidebarIsOpen = false;
  toggleButton.addEventListener('click', () => {
    container.classList.toggle('sidebar--open');
    toggleButton.classList.toggle('toggle-button--toggled');

    if (sidebarIsOpen) {
      icon.innerHTML = 'info_outline';
    } else {
      icon.innerHTML = 'close';
    }

    sidebarIsOpen = !sidebarIsOpen;
  });
}
