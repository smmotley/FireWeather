const content = `
   <!-- Test Test Test Begin Side Bar
    <div class="sidebar" data-color="green" data-image="{% static 'lite_dashboard/assets/img/sidebar-5.jpg' %}">
    -->
        <!--

        Tip 1: you can change the color of the sidebar using: data-color="blue | azure | green | orange | red | purple"
        Tip 2: you can also add an image using data-image tag

        -->
    	<div class="sidebar-wrapper">
             <div class="logo">
                    <a href="" class="simple-text logo-normal">
                        PCWA
                    </a>
                </div>
            <ul class="nav">
                <li class="nav-item">
                        <a class="nav-link" data-toggle="collapse" href="#componentsExamples">
                            <i class="fa fa-globe"></i>
                            <p>
                                Map Layers
                                <b class="caret"></b>
                            </p>
                        </a>
                        <div class="collapse " id="componentsExamples">
                            <ul class="nav">
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/buttons.html">
                                        <span class="sidebar-mini">R</span>
                                        <span class="sidebar-normal">Radar</span>
                                        <li data-do="set,gust" data-pilot="true" data-water="true">
                                            <div class="ovr-sub" data-name="gust">
                                                <input name="gust" data-do="radar" id="ovc-gust" checked="" type="checkbox">
                                                <label data-do="toggleFav,gust" for="ovc-gust"></label>
                                            </div>
                                            <span>Radar<span class="iconfont"></span></span>
						                </li>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/grid.html">
                                        <span class="sidebar-mini">GS</span>
                                        <span class="sidebar-normal">Grid System</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/panels.html">
                                        <span class="sidebar-mini">P</span>
                                        <span class="sidebar-normal">Panels</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/sweet-alert.html">
                                        <span class="sidebar-mini">SA</span>
                                        <span class="sidebar-normal">Sweet Alert</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/notifications.html">
                                        <span class="sidebar-mini">N</span>
                                        <span class="sidebar-normal">Notifications</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/icons.html">
                                        <span class="sidebar-mini">I</span>
                                        <span class="sidebar-normal">Icons</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/typography.html">
                                        <span class="sidebar-mini">T</span>
                                        <span class="sidebar-normal">Typography</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="dashboard.html">
                        <i class="pe-7s-graph"></i>
                        <p>Dashboard</p>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-toggle="collapse" href="#dashboard">
                        <i class="fa fa-globe"></i>
                        <p>
                            Maps
                            <b class="caret"></b>
                        </p>
                    </a>
                        <div class="collapse " id="dashboard">
                            <ul class="nav">
                                <li class="nav-item ">
                                    <a class="nav-link" href="dashboard.html">
                                        <span class="sidebar-mini">F</span>
                                        <span class="sidebar-normal">Full Screen Map</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href= "{% static 'dashboard_fullmap.html' %}">
                                        <span class="sidebar-mini">GS</span>
                                        <span class="sidebar-normal">Grid System</span>
                                    </a>
                                </li>
                                <li class="nav-item ">
                                    <a class="nav-link" href="./components/panels.html">
                                        <span class="sidebar-mini">P</span>
                                        <span class="sidebar-normal">Panels</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                </li>

            </ul>
    	</div>
    </div>
    <!-- End Side Bar-->
`;

//export default content;
export default content;
