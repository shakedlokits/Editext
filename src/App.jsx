import React from 'react';
import path from 'path';
import Result from './components/Result/Result';
import Sidebar from './components/Sidebar/Sidebar';
import {
  Line,
  Circle,
} from 'rc-progress';
import {
  getNameFromPath,
  parseFile,
  writeToFile,
} from './utils/OCRUtils';
import {
  remote,
} from 'electron';

const {
  dialog,
} = require('electron').remote;
const Jimp = require('jimp');

const TEMP_DIR = 'temp';

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      results: {},
      selectedFileName: '',
      loading: false,
      split: false,
    };
    this.getNewResults = this.getNewResults.bind(this);
    this.openFiles = this.openFiles.bind(this);
    this.updateResult = this.updateResult.bind(this);
    this.getAndSetOCR = this.getAndSetOCR.bind(this);
    this.onFileNameClick = this.onFileNameClick.bind(this);
    this.onEditorStateChange = this.onEditorStateChange.bind(this);
    this.onFileSelectionClick = this.onFileSelectionClick.bind(this);
    this.saveButtonClicked = this.saveButtonClicked.bind(this);
    this.saveAllSelectedResults = this.saveAllSelectedResults.bind(this);
    this.backupFiles = this.backupFiles.bind(this);
    this.setProgress = this.setProgress.bind(this);
    this.reloadResults = this.reloadResults.bind(this);
    this.onSplitClick = this.onSplitClick.bind(this);
    this.splitImage = this.splitImage.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.selectedFileName !== prevState.selectedFileName) {
      this.getAndSetOCR(this.state.results[this.state.selectedFileName], false, this.state.split);
      this.backupFiles();
    }
  }

  onFileNameClick(name) {
    return () => {
      this.setState({
        selectedFileName: name,
      });
    };
  }

  onSplitClick(state) {
    this.setState({
      split: state.target.checked,
    });
  }

  onFileSelectionClick(name) {
    return (state) => {
      this.updateResult(null, state.target.checked, null, name);
    };
  }

  onEditorStateChange(name) {
    return (editorText) => {
      this.updateResult(editorText, null, null, name);
    };
  }

  getNewResults(paths) {
    if (paths) {
      const newResults = Object.assign({}, this.state.results);
      paths.map((imagePath) => {
        const name = getNameFromPath(imagePath);
        newResults[name] = {
          name,
          imagePath,
          editorText: '',
          selected: false,
          changed: false,
        };
      });
      this.setState({
        results: newResults,
      });
    }
  }

  getAndSetOCR(fileResults, shouldReload, shouldSplit) {
    if (fileResults && (!fileResults.editorText || shouldReload)) {
      if (shouldSplit) {
        this.splitImage(fileResults.imagePath, () => {
          let splitResults = '';
          const rightPage = path.join(remote.app.getPath(TEMP_DIR), 'editext_split_right.jpg');
          const leftPage = path.join(remote.app.getPath(TEMP_DIR), 'editext_split_left.jpg');
          parseFile(rightPage, (ocr1) => {
            splitResults += ocr1.text;
            parseFile(leftPage, (ocr2) => {
              splitResults += ocr2.text;
              this.updateResult(splitResults, null, null, fileResults.name);
            }, this.setProgress);
          }, this.setProgress);
        });
      } else {
        parseFile(fileResults.imagePath, (ocr) => {
          this.updateResult(ocr.text, null, null, fileResults.name);
        }, this.setProgress);
      }
    }
  }

  openFiles() {
    dialog.showOpenDialog({
      filters: [{
        name: 'Images',
        extensions: ['jpg', 'png'],
      }],
      properties: ['openFile', 'multiSelections'],
    }, this.getNewResults);
  }

  updateResult(editorText, selected, backup, name) {
    const newResults = Object.assign({}, this.state.results);
    if (editorText !== null) {
      newResults[name] = Object.assign({}, this.state.results[name], {
        editorText,
        changed: true,
      });
    }
    if (selected !== null) {
      newResults[name] = Object.assign({}, this.state.results[name], {
        selected,
      });
    }
    if (backup !== null) {
      newResults[name] = Object.assign({}, this.state.results[name], {
        changed: false,
      });
    }
    this.setState({
      results: newResults,
    });
  }

  saveAllSelectedResults(outputFile) {
    if (outputFile && Object.keys(this.state.results).length) {
      const resultKeys = Object.keys(this.state.results).sort();
      let key, output = '';
      for (key of resultKeys) {
        const result = this.state.results[key];
        if (result.selected) {
          output += `${result.editorText}\n`;
        }
      }
      writeToFile(outputFile, output);
    }
  }

  saveButtonClicked() {
    dialog.showSaveDialog({
      defaultPath: 'output.txt',
    }, this.saveAllSelectedResults);
  }

  backupFiles() {
    if (Object.keys(this.state.results).length) {
      const resultKeys = Object.keys(this.state.results);
      let key;
      for (key of resultKeys) {
        const result = this.state.results[key];
        if (result.changed) {
          const backupAddress =
            `${result.imagePath.split('.').slice(0, -1).join('.')}.backup.txt`;
          writeToFile(backupAddress, result.editorText);
          this.updateResult(null, null, true, key);
        }
      }
    }
  }

  setProgress(progress) {
    this.setState({
      loading: progress,
    });
  }

  reloadResults() {
    this.getAndSetOCR(this.state.results[this.state.selectedFileName], true, this.state.split);
  }

  loadingScreen() {
    const loadingData = this.state.loading;
    return (
      <div id="loading">
        <h4>{loadingData.status ? loadingData.status.toUpperCase() : 'Loading...'}</h4>
        <Line percent={loadingData.progress ? Math.round(loadingData.progress * 100) : 0} strokeWidth="2" strokeColor="#50bb5e" />
      </div>
    );
  }

  splitImage(imagePath, callback) {
    Jimp.read(imagePath, (err, image) => {
      if (err) throw err;

      const height = image.bitmap.height;
      const halfWidth = Math.floor(image.bitmap.width / 2);
      const leftImage =
        path.join(remote.app.getPath(TEMP_DIR), 'editext_split_left.jpg');
      const rightImage =
        path.join(remote.app.getPath(TEMP_DIR), 'editext_split_right.jpg');

      image
        .clone()
        .crop(0, 0, halfWidth, height)
        .write(leftImage, () => {
          image
            .clone()
            .crop(halfWidth, 0, halfWidth, height)
            .write(rightImage, () => {
              callback();
            });
        });
    });
  }

  render() {
    const fileResults = this.state.results[this.state.selectedFileName];
    const resultComponent = (fileResults) ?
      <Result {...fileResults} shouldSplit={this.state.split} onChange={this.onEditorStateChange(fileResults.name)} /> :
      '';
    return (
      <div className="window">
        <div id="app" className="window-content">
          <link rel="stylesheet" type="text/css" href="./App.css" />
          <div className="pane-group">
            {(this.state.loading) ? this.loadingScreen() : resultComponent}
            <Sidebar
              results={this.state.results}
              selected={this.state.selectedFileName}
              openFiles={this.openFiles}
              onFileNameClick={this.onFileNameClick}
              onFileNameSelected={this.onFileSelectionClick}
              onSaveButtonClicked={this.saveButtonClicked}
              onReloadButtonClicked={this.reloadResults}
              onSplitSelected={this.onSplitClick}
              split={this.state.split}
            />
          </div>
        </div>
      </div>
    );
  }
}
