const style = document.createElement('style');
style.textContent = `
  @import '/grid.css';
  :host {
    display: none;
    opacity: 0;
    transition: opacity 0.3s;
    max-width: 992px;
    margin: 0 auto;
  }
`;

class Page extends HTMLElement{
  constructor() {
    super();

    this.shadow = this.attachShadow({mode: 'open'});

    this.shadow.appendChild(style.cloneNode(true));

    this.dom = document.createElement('div');
    this.shadow.appendChild(this.dom);

    this.isHidden = true;
  }
  show(prev) {
    if(!this.parentNode) document.querySelector('#mainview').appendChild(this);
    if(!this.isHidden) return;
    this.isHidden = false;
    if(prev) {
      prev.hide(true);
      this.prev = prev;
    }
    window.setTimeout(()=>{
      this.style.display = 'block';
      window.requestAnimationFrame(()=>this.style.opacity = 1);
    }, 301);

  }
  hide(sub) {
    if(this.isHidden) return;
    this.isHidden = true;
    this.style.opacity = 0;
    window.setTimeout(()=>this.style.display = 'none', 300);
    if(!sub && this.prev) {
      this.prev.show();
    }
  }
}

export default Page;
//customElements.define('kst-page', Page);
