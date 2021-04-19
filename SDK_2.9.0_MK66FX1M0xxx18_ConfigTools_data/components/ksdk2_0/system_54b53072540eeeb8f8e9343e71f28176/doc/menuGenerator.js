/*
 * Copyright 2020 NXP
 * To be used with MCUXpresso Config Tools under its Software License Agreement.
 */

/* 
 * Global objects:
 *  - contents - representation of contents.xml
 *  - currentPage - name of the currenlty opened *.md file
 */

/* 
 * Builds final string from parts
 */
function StringBuilder() {
    this.stringBuilder = [];
    
    /* Adds part of final string */
    this.addString = function(part) {
        this.stringBuilder.push(part)
    }
    
    /* Concatenates all parts and returns final string */
    this.toString = function() {
        return this.stringBuilder.join("");
    }
}

/* 
 * Links contains parts specific to link
 */
function Link(name, page, selected) {
    this.name = name;
    this.page = page;
    this.selected = selected;
    
    /* Constructs HTML representation of link based on parameters set to this link */
    this.toString = function() {
        // FIXME Refactor to use StringBuilder
        var arr = [];
        arr.push("<span class=\"", selected ? "selected" : "", "\"><a href=\"", currentComponentDirectory, "/doc/", page, "\">", name, "</a></span>");
        return arr.join("");
    }
}

/* 
 * Finds path to currently selected path in given sections.
 * This function calls itself recursively with all subsections of given sections.
 * Recursion ends when current section's file is equal to currently selected page.
 */
function findCurrentSectionPath(sections) {
    var result = [];
    for (var index = 0; index < sections.length; index++) {
        var entry = sections[index];
        // Checks this section for match
        if (entry.getFile() == currentPage) {
            debugLogger.info("Found leaf node: " + entry);
            result.push(entry);
            break; // Ends recursion
        }
        // If currentPage does not match this section, try to look in sub-sections
        if (entry.hasSubSections()) {
            var recursionResult = findCurrentSectionPath(entry.getSections());
            if (recursionResult.length != 0) {
                result.push(entry); // This section
                recursionResult.forEach(function(entry) {
                    result.push(entry); // Rest of recursion result
                })
                debugLogger.info("SubSection path found: " + result.toString());
            }
        }
    }
    return result;
}

/* 
 * This function generates HTML output for one line of menu.
 * Input is object that provides sub-sections.
 */
function generateLinks(sectionsProvider, currentSectionPathNames) {
    var links = [];
    var stringBuilder = new StringBuilder();
    
    links.push("<div>");
    var sections = sectionsProvider.getSections();
    debugLogger.info("Generating link row for: " + sectionsProvider);
    sections.forEach(function(entry) {
        if (currentSectionPathNames.indexOf(entry.getName()) > -1 ) {
            links.push("<b>" + getLink(entry) + "</b>");
        } else {
            links.push(getLink(entry));
        }
    });
    links.push("</div>");
    stringBuilder.addString(links.join(" | "));
    return stringBuilder.toString();
}

/*
 * Main function of this generator.
 * Output is final HTML of menu.
 */
function generate() {
    if (contents == undefined) {return "";}
    if (currentPage == undefined) {return "";}
    var stringBuilder = new StringBuilder();
    
    // Add main menu
    var currentSectionPath = findCurrentSectionPath(contents.getSections());
    var currentSectionPathNames = [];
    for (var index = 0; index < currentSectionPath.length; index++) {
        currentSectionPathNames.push(currentSectionPath[index].getName());
    }
    stringBuilder.addString(generateLinks(contents, currentSectionPathNames));
    
    if (currentSectionPath.length != 0) {
        debugLogger.info("Path : " + currentSectionPath);
        for (var index = 0; index < currentSectionPath.length; index++) {
            var currentSection = currentSectionPath[index];
            if (currentSection.hasSubSections()) {
                debugLogger.info("Generating links for: " + currentSection);
                // Add section that leads to currently selected page
                stringBuilder.addString(generateLinks(currentSection, currentSectionPathNames));
            }
        }
    }
    
    return stringBuilder.toString();
}

/*
 * Constructs Link object from one entry in sections list.
 */
function getLink(entry) {
    var link = new Link(entry.getName(), entry.getFile(), false /*FIXME Selection is not set */);
    return link;
}

generate();