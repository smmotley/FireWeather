import * as colorTexture from "./color-texture.js";


const container = document.createElement('div');

//document.getElementById('map').innerHTML = ' <span id="openNav" style="font-size:30px;cursor:pointer;z-index:2;' +' margin-top: 30px; position: absolute">&#9776; open</span>';
//document.getElementById ("openNav").addEventListener ("click", function(){ document.getElementById("mySidenav").style.width = "250px";});
//document.getElementById ("closeNav").addEventListener ("click", function(){document.getElementById("mySidenav").style.width = "0";});

export default function(content) {
    //container.style.cssText = 'position: absolute';
    var el = document.querySelector('.sidenav');
    //container.classList.add('sidebar-wrapper');
    container.innerHTML = content;

    el.appendChild(container);

    //const toggleButton = document.createElement('button');
    //const icon = document.createElement('i');
    const checkboxes = document.querySelectorAll("input[type=checkbox]")

    /*icon.innerHTML = 'info_outline';

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
    */
    return  checkboxes
}