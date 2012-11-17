package com.lemlabs.nlp;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;

import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.DefaultPaths;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.pipeline.TrueCaseAnnotator;
import edu.stanford.nlp.util.StringUtils;
import edu.stanford.nlp.util.logging.StanfordRedwoodConfiguration;

/**
 * This class puts a Socket-based server wrapper around the Stanford CoreNLP package.
 * It is based on the Stanford CoreNLP 2012-07-09 code.
 * 
 * Arguments:
 * <ul>
 *  <li>-port 9900</li>
 * </ul>
 *
 * (c) 2012 LEM Labs, Inc.
 * Mike Hewett   (Github: mhewett)
 *
 */
public class StanfordCoreNLPServer
{
  public static String DEFAULT_PORT = "9900";
  public static String DEFAULT_NLP_DIR = "/usr/lib/stanford-corenlp-2012-07-09";
  
  private static String port = DEFAULT_PORT;
  private static String nlpDir = DEFAULT_NLP_DIR;
  
  // These are from StringUtils in the Stanford CoreNLP package.
  private static final String PROP = "-prop";
  private static final String PROPS = "-props";
  private static final String PROPERTIES = "-properties";
  private static final String ARGS = "-args";
  private static final String ARGUMENTS = "-arguments";

  
  /**
   * Start the server.
   * 
   * Args:
   * <ul>
   *  <li>-port 9900</li>
   * </ul>
   */
  public static void main(String[] args)
  {
    System.out.println("Server wrapper for Stanford CoreNLP library.   LEM Labs, Inc.  Nov. 2012");
    
    // parseArguments will exit if there is an error
    parseArguments(args);
    
    StanfordRedwoodConfiguration.minimalSetup();

    //
    // process the arguments
    String[] commandLineArgs = args;  // So we can assign the array later;
    Properties props = new Properties();
    
    // We need to process the -props argument ourselves because the Stanford CoreNLP program
    // has a bug where it gets into an infinite loop when loading the properties.
    List<String> argsList = Arrays.asList(args);
    if (argsList.contains(PROP) || argsList.contains(PROPS) || argsList.contains(PROPERTIES) || argsList.contains(ARGUMENTS) || argsList.contains(ARGS))
    {
      // Figure out the actual arg
      int propIndex = -1;
      String propFile = null;
      for (int i=0; i < args.length; ++i)
      {
        if (args[i].equals(PROP) || args[i].equals(PROPS) || args[i].equals(PROPERTIES) || args[i].equals(ARGUMENTS) || args[i].equals(ARGS))
        {
          propIndex = i;
          break;
        }
      }
      
      // Did we find the -props argument?
      if (propIndex >= 0)
      {
        if (propIndex < args.length-1)
        {
          propFile = args[propIndex+1];  // Save the filename
          argsList.remove(propIndex+1);  // Remove the argument
          argsList.remove(propIndex);    // remove the file
        }
        else
        {
          fatal("The " + args[propIndex] + " argument requires a filename for a value");
        }

        // Load the properties file
        if ((new File(propFile)).canRead())
        {
          try {
            System.out.println("Reading properties file: " + propFile);
            InputStream is = new BufferedInputStream(new FileInputStream(propFile));
            props.load(is);
          } catch (IOException ex) {
            ex.printStackTrace();
            fatal("Error reading properties file (" + propFile + "): " + ex.getMessage());
          }
        }
        else
        {
          fatal("Unable to read the properties file: " + propFile);
        }
        
        // Reset the args to the new list
        commandLineArgs = argsList.toArray(new String[0]);
      }
    }
    
    //
    // extract all the properties from the command line
    // if cmd line is empty, set the props to null. The processor will search for the properties file in the classpath
    Properties allProps = new Properties();
    
    if(args.length > 0){
      allProps = StringUtils.argsToProperties(commandLineArgs);
      allProps.putAll(props);
      boolean hasH = allProps.containsKey("h");
      boolean hasHelp = allProps.containsKey("help");
      if (hasH || hasHelp) {
        String helpValue = hasH ? allProps.getProperty("h") : allProps.getProperty("help");
        printHelp(System.err, helpValue);
        return;
      }
    }
    
    // multithreading thread count
    String numThreadsString = allProps.getProperty("threads");
    @SuppressWarnings("unused")
    int numThreads = 1;
    try{
      if (numThreadsString != null) {
        numThreads = Integer.parseInt(numThreadsString);
      }
    } catch(NumberFormatException e) {
      fatal("-threads [number]: was not given a valid number: " + numThreadsString);
    }

    //
    // construct the pipeline
    //
    System.out.println("Creating the NLP pipeline");
    StanfordCoreNLP pipeline = new StanfordCoreNLP(allProps);
    props = pipeline.getProperties();
    //long setupTime = tim.report();

    // blank line after all the loading statements to make output more readable
    System.out.println("");
    
    try
    {
      openSocket(pipeline);
    } catch (IOException ex)
    {
      ex.printStackTrace();
      fatal(ex.getMessage());
    }

  }
  
  /**
   * Open a socket and listen for text to pass on to the Stanford Core NLP pipeline.
   *
   * @param pipeline The pipeline to be used
   * @throws IOException If there is an IO problem
   */
  private static void openSocket(StanfordCoreNLP pipeline) throws IOException {
    //String encoding = Charset.defaultCharset().name();  //   pipeline.properties.getProperty("encoding");
    ServerSocket server = null;
    Socket client = null;
    
    try {
      server = new ServerSocket(Integer.parseInt(port));
      System.out.println("CoreNLP Server is listening on port " + port);
      
      // Wait for the client to connect.
      client = server.accept();
      System.out.println("Opening connection");
      
      // Set up the IO streams
      PrintWriter clientOut = new PrintWriter(client.getOutputStream(), true);
      BufferedReader clientIn = new BufferedReader(new InputStreamReader(client.getInputStream()));
      String inline = null;
      
      // Read input
      while ((inline = clientIn.readLine()) != null)
      {
        if (inline.length() > 0) {
          Annotation anno = pipeline.process(inline);
          //pipeline.prettyPrint(anno, clientOut);
          pipeline.xmlPrint(anno, clientOut);
          System.out.println("processed " + inline.length() + " bytes.");
        }
        else
          clientOut.println();
      }

    } finally {
      System.out.println("Closing connection");
      if (server != null) 
      {
        server.close();
      }
    }

    System.out.println("Shutting down server.");
  }

  /**
   * From edu.stanford.nlp.pipeline.StanfordCoreNLP.java v2012-07-09.
   * 
   * Prints the list of properties required to run the pipeline
   * 
   * @param os
   *          PrintStream to print usage to
   * @param helpTopic
   *          a topic to print help about (or null for general options)
   */
  private static void printHelp(PrintStream os, String helpTopic) {
    if (helpTopic.toLowerCase().startsWith("pars")) {
      os.println("StanfordCoreNLP currently supports the following parsers:");
      os.println("\tstanford - Stanford lexicalized parser (default)");
      os.println("\tcharniak - Charniak and Johnson reranking parser (sold separately)");
      os.println();
      os.println("General options: (all parsers)");
      os.println("\tparser.type - selects the parser to use");
      os.println("\tparser.model - path to model file for parser");
      os.println("\tparser.maxlen - maximum sentence length");
      os.println();
      os.println("Stanford Parser-specific options:");
      os.println("(In general, you shouldn't need to set this flags)");
      os.println("\tparser.flags - extra flags to the parser (default: -retainTmpSubcategories)");
      os.println("\tparser.debug - set to true to make the parser slightly more verbose");
      os.println();
      os.println("Charniak and Johnson parser-specific options:");
      os.println("\tparser.executable - path to the parseIt binary or parse.sh script");
    } else {
      // argsToProperties will set the value of a -h or -help to "true" if no arguments are given
      if ( ! helpTopic.equalsIgnoreCase("true")) {
        os.println("Unknown help topic: " + helpTopic);
        os.println("See -help for a list of all help topics.");
      } else {
        printRequiredProperties(os);
      }
    }
  }

  /**
   * From edu.stanford.nlp.pipeline.StanfordCoreNLP.java v2012-07-09. Prints the
   * list of properties required to run the pipeline
   * 
   * @param os
   *          PrintStream to print usage to
   */
  private static void printRequiredProperties(PrintStream os)
  {
    // TODO some annotators (ssplit, regexner, gender, some parser
    // options, dcoref?) are not documented
    os.println("The following properties can be defined:");
    os.println("(if -props or -annotators is not passed in, default properties will be loaded via the classpath)");
    os.println("\t\"props\" - path to file with configuration properties");
    os.println("\t\"annotators\" - comma separated list of annotators");
    os.println("\tThe following annotators are supported: cleanxml, tokenize, ssplit, pos, lemma, ner, truecase, parse, coref, dcoref, nfl");

    os.println("\n\tIf annotator \"tokenize\" is defined:");
    os.println("\t\"tokenize.options\" - PTBTokenizer options (see edu.stanford.nlp.process.PTBTokenizer for details)");
    os.println("\t\"tokenize.whitespace\" - If true, just use whitespace tokenization");

    os.println("\n\tIf annotator \"cleanxml\" is defined:");
    os.println("\t\"clean.xmltags\" - regex of tags to extract text from");
    os.println("\t\"clean.sentenceendingtags\" - regex of tags which mark sentence endings");
    os.println("\t\"clean.allowflawedxml\" - if set to false, don't complain about XML errors");

    os.println("\n\tIf annotator \"pos\" is defined:");
    os.println("\t\"pos.maxlen\" - maximum length of sentence to POS tag");
    os.println("\t\"pos.model\" - path towards the POS tagger model");

    os.println("\n\tIf annotator \"ner\" is defined:");
    os.println("\t\"ner.model.3class\" - path towards the three-class NER model");
    os.println("\t\"ner.model.7class\" - path towards the seven-class NER model");
    os.println("\t\"ner.model.MISCclass\" - path towards the NER model with a MISC class");

    os.println("\n\tIf annotator \"truecase\" is defined:");
    os.println("\t\"truecase.model\" - path towards the true-casing model; default: "
        + DefaultPaths.DEFAULT_TRUECASE_MODEL);
    os.println("\t\"truecase.bias\" - class bias of the true case model; default: "
        + TrueCaseAnnotator.DEFAULT_MODEL_BIAS);
    os.println("\t\"truecase.mixedcasefile\" - path towards the mixed case file; default: "
        + DefaultPaths.DEFAULT_TRUECASE_DISAMBIGUATION_LIST);

    os.println("\n\tIf annotator \"nfl\" is defined:");
    os.println("\t\"nfl.gazetteer\" - path towards the gazetteer for the NFL domain");
    os.println("\t\"nfl.relation.model\" - path towards the NFL relation extraction model");

    os.println("\n\tIf annotator \"parse\" is defined:");
    os.println("\t\"parser.model\" - path towards the PCFG parser model");

    /*
     * XXX: unstable, do not use for now
     * os.println("\n\tIf annotator \"srl\" is defined:"); os.println(
     * "\t\"srl.verb.args\" - path to the file listing verbs and their core arguments (\"verbs.core_args\")"
     * ); os.println(
     * "\t\"srl.model.id\" - path prefix for the role identification model (adds \".model.gz\" and \".fe\" to this prefix)"
     * ); os.println(
     * "\t\"srl.model.cls\" - path prefix for the role classification model (adds \".model.gz\" and \".fe\" to this prefix)"
     * ); os.println(
     * "\t\"srl.model.jic\" - path to the directory containing the joint model's \"model.gz\", \"fe\" and \"je\" files"
     * ); os.println(
     * "\t                  (if not specified, the joint model will not be used)"
     * );
     */

    os.println("\nCommand line properties:");
    os.println("\t\"file\" - run the pipeline on the content of this file, or on the content of the files in this directory");
    os.println("\t         XML output is generated for every input file \"file\" as file.xml");
    os.println("\t\"extension\" - if -file used with a directory, process only the files with this extension");
    os.println("\t\"filelist\" - run the pipeline on the list of files given in this file");
    os.println("\t             output is generated for every input file as file.outputExtension");
    os.println("\t\"outputDirectory\" - where to put output (defaults to the current directory)");
    os.println("\t\"outputExtension\" - extension to use for the output file (defaults to \".xml\" for XML, \".ser.gz\" for serialized).  Don't forget the dot!");
    os.println("\t\"outputFormat\" - \"xml\" to output XML (default), \"serialized\" to output serialized Java objects");
    os.println("\t\"replaceExtension\" - flag to chop off the last extension before adding outputExtension to file");
    os.println("\t\"noClobber\" - don't automatically override (clobber) output files that already exist");
    os.println("\t\"threads\" - multithread on this number of threads");
    os.println("\nIf none of the above are present, run the pipeline in an interactive shell (default properties will be loaded from the classpath).");
    os.println("The shell accepts input from stdin and displays the output at stdout.");

    os.println("\nRun with -help [topic] for more help on a specific topic.");
    os.println("Current topics include: parser");

    os.println();
  }

  /**
   * Show the help for this program.
   */
  public static void showHelp()
  {
    System.out.println("Usage:");
    System.out.println("  java com.lemlabs.nlp.StanfordCoreNLPServer -port 9900 -nlpdir /path/to/StanfordCoreNLP/distribution");
  }
  
  /**
   * Parse the command line arguments and store them in
   * global static variables.
   * 
   * @param args command-line arguments
   */
  public static void parseArguments(String[] args)
  {
    // If we add many more arguments we should use a standard parsing library
    int index = 0;
    while (index < args.length)
    {
      if (args[index] == "-port")
      {
        if (index < args.length-1)
        {
          port = args[++index];
          try {
            @SuppressWarnings("unused")
            int val = Integer.parseInt(port);
          } catch (NumberFormatException ex) {
            fatal("Error: the -port option requires a valid integer argument");
          }
        }
        else
          fatal("Error: the -port option requires an integer argument");
      }
      
      else if (args[index] == "-nlpdir")
      {
        if (index < args.length-1)
        {
          nlpDir = args[++index];
          try {
            if (! (new File(nlpDir).isDirectory()))
                fatal("Error: the -nlpdir option requires a valid pathname argument");
          } catch (Exception ex) {
            fatal("Error: the " + nlpDir + " path is not accessible");
          }
        }
        else
          fatal("Error: the -nlpdir option requires a pathname argument");
      }
      
      /*  Allow other arguments, to pass on to the CoreNLP pipeline. 
      else
        fatal("Invalid argument: " + args[index]);
      */
    }
  }

  /**
   * Print the error, show help, and exit.
   * @param errString a string to print
   */
  private static void fatal(String errString)
  {
    System.out.println(errString);
    showHelp();
    System.exit(-1);
  }

}
