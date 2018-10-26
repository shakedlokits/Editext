import React from 'react';

export default class Sidebar extends React.Component {
  render() {
    return (
      <div id="sidebar" className="pane-sm sidebar">
        <link rel="stylesheet" type="text/css" href="components/Sidebar/Sidebar.css" />
        <ul id="file-list" className="list-group">
          {Object.keys(this.props.results).map((name) => {
            const isSelected = (name === this.props.selected) ? 'active' : ''
            const isChecked = this.props.results[name].selected;
            return (
              <li key={name} className={`list-group-item ${isSelected}`}>
                <input type="checkbox" checked={isChecked} onChange={this.props.onFileNameSelected(name)}/>
                <a onClick={this.props.onFileNameClick(name)}>{name}</a>
              </li>
            )
          })}
        </ul>
        <div id="controls">
          <button onClick={this.props.openFiles} className="btn btn-large btn-default">Open</button>
          <button onClick={this.props.onSaveButtonClicked} className="btn btn-large btn-positive">Save Selected</button>
        </div>
      </div>
    );
  }
}
