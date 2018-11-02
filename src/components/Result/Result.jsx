import React from 'react';
import {
  Editor,
  EditorState,
  ContentState,
  Modifier,
} from 'draft-js';

function createEditorStateFromText(text) {
  return EditorState.createWithContent(ContentState.createFromText(text));
}

export default class Result extends React.Component {
  handleEdit(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <div id="result" className="pane">
        {
          (this.props.shouldSplit)
            ? <link rel="stylesheet" type="text/css" href="components/Result/Result-split.css" />
            : ''
        }
        <link rel="stylesheet" type="text/css" href="components/Result/Result.css" />
        <div className="pane-group">
          <textarea
            className="pane"
            id="editor"
            value={this.props.editorText}
            onChange={this.handleEdit.bind(this)}
          />
          <div className="pane" id="preview-container">
            <img alt="preview" id="preview" src={`file://${this.props.imagePath}`} />
          </div>
        </div>
      </div>
    );
  }
}
