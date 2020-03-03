# SeeProfiler - See++ Compiler Profiler

Visual Profiler for Clang 9 or higher. By Using the flag *-ftime-trace* (see [Aras' blog post](https://aras-p.info/blog/2019/01/12/Investigating-compile-times-and-Clang-ftime-report/) or [Clang 9 release notes](https://releases.llvm.org/9.0.0/tools/clang/docs/ReleaseNotes.html#id7)) clang will create a time report (*.json*) next to the generated *.obj* file. Within See++ Compiler Profiler you can aggregate mulitple reports in one single view giving valuable information at a project scale.

It will help you indentify and track inside your codebase the most expensive includes, templates, function instantiations... 

## Usage

//TODO - add screenshots here

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
npm export
```

## External Libraries

- See++ Compiler Profiler is based on [Electron](https://www.electronjs.org/). 
- [Electron](https://www.electronjs.org/) is based on [node.js](https://nodejs.org/).
