

# See++ Compiler Profiler [![Export App](https://github.com/Viladoman/SeeProfiler/workflows/Export%20App/badge.svg)](https://github.com/Viladoman/SeeProfiler/actions)

Visual C/C++ Profiler for Clang 9 or higher. Using the flag *-ftime-trace* (see [Clang 9 release notes](https://releases.llvm.org/9.0.0/tools/clang/docs/ReleaseNotes.html#id7)) clang will create a time report (*.json*) next to the generated *.obj* file. Within **See++ Compiler Profiler** you can aggregate mulitple reports in one single view giving valuable information at a project scale.

It will help you indentify and track inside your codebase the most expensive includes, templates, function instantiations... 

## Usage

Drag or open the folder or files you want to inspect. All the files will be parsed ( this can take some time if the project is really big) and the overview window will show up with a full recap for all translation units found.

![Overview screenshot](https://github.com/Viladoman/SeeProfiler/wiki/images/overviewScreenshot.png?raw=true)

The graphs on top can be used to switch between the different categories in order to visualize more specific data. 

At any point you can double click one row to visualize the actual timeline for the given translation unit or the translation unit that had the worst offender ( if a source, class, function has been selected )

![Timeline screenshot](https://github.com/Viladoman/SeeProfiler/wiki/images/timelineScreenshot.png?raw=true)

## How to build the project

First of all you need [node.js](https://nodejs.org/) installed. 

Open a terminal in your project folder, and make sure you are inside the SeeProfiler subfolder:

```
cd SeeProfiler
```

Install the project dependencies:  

```
npm install
```

Run the application:

```
npm start
```

Alternatively you can also run it with within Visual Studio Code. 

## Creating a package

If you want to export the project as a standalone application:

```
npm run export
```

## External Libraries

- See++ Compiler Profiler is based on [Electron](https://www.electronjs.org/). 
- [Electron](https://www.electronjs.org/) is based on [node.js](https://nodejs.org/).
