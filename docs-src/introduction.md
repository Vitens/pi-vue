# Introduction
PIVue is a plugin for the [Vue.js](http://vuejs.org) framework that
allows for building custom displays and applications using
[Osisoft PI](http://osisoft.com) data. PI Vue connects directly to a PI
Web API instance.

## Features
- Basic display components such as Values and Multistates
- Interactive Trends with linked trace and zoom, export functions,
  thresholding and value interpolation
- Advanced components to navigate PI A/F structures such as a Tree Browser, Cascader
- An Promises based API to interact with PI Web API servers

## ToDo
PIVue is still a work in progress. There are many things it currently
does not support but are planned, such as
- Different and mixed types of charts (bar, pie, boxplot, etc.)
- Data Tables
- Batch Calls

## Why Not Use?

### PI Vision
PI Vision is capable of doing most of what PIVue does, but is designed for building **displays**. PIVue is focussed on building rich and interactive **applications** fully tailored for the users demands. If you need a simple display consisting of standard components, consider PI Vision, if you need more complexity or want to build things tailormade, PIVue may be for you.

### Angular
Angular and Vue are both mature frameworks for building large and
complex applications with wide development support. However, compared to Angular Vue is less opinionated,
comes with a much less steep learning curve and is arguably a better
choice for simple applications.

In the end it comes down to developer preference, if you want a rigid
development system with a One-True-Way of building applications,
choose Angular. If you prefer more flexibility, consider using (PI)Vue.
