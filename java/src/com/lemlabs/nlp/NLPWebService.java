package com.lemlabs.nlp;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import com.sun.jersey.api.representation.Form;

/**
 * This is the root of the NLP web service.
 * 
 * @author hewett
 * @date Jan 27, 2013
 */
@Path("/corenlp/api/v1")
public class NLPWebService
{
  public static final boolean DEBUG = false;
  
  @GET
  @Produces(MediaType.TEXT_HTML)
  @Path("/hello")
  public String getMessage() {
    System.out.println("Hello request received.");
    return "Hello, world!";
  }
  
  /**
   * Sends the input text to the Stanford CoreNLP process, and returns
   * the output as XML in the standard Stanford CoreNLP XML format.
   * 
   * Method: POST
   * URL base: /corenlp/api/v1/
   * 
   * Input parameters:
   * <ul>
   *   <li><b>text</b>: the string to process</li>
   * </ul>
   * 
   * Output: application/xml, an XML document
   * 
   * Error output is text/plain, with an error message
   * 
   * Return values:
   * <ul>
   *   <li><b>201</b>: the string was successfully processed</li>
   *   <li><b>204</b>: the output was empty (usually because the input was empty)</li>
   *   <li><b>400</b>: the 'text' form parameter is not present (response is 
   *   <li><b>500</b>: an error occurred.
   * </ul>
   * 
   * @param uriInfo information about the incoming URL
   * @param form must include a 'text' parameter
   * @return 
   */
  @POST
  @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
  @Produces( {MediaType.APPLICATION_XML, MediaType.TEXT_PLAIN} )
  @Path("analysis")
  public Response nlpWsAnalyze(@Context UriInfo uriInfo, Form form)
  {
    String inputText = form.getFirst("text");
  
    if (DEBUG) {
      System.out.println("Input received: " + inputText);
    }
    
    // Missing parameter: 400 response.
    if (inputText == null)
      return Response.status(Response.Status.BAD_REQUEST).type(MediaType.TEXT_PLAIN_TYPE).entity("Please provide a form parameter named 'test'").build();
    
    // No input: 204 response
    inputText = inputText.trim();
    if (inputText.length() == 0)
      return Response.noContent().build();
    
    String xmlOutput = StanfordCoreNLPServer.processText(inputText);

    if (DEBUG) {
      System.out.println("XML returned: " + xmlOutput);
    }
    
    // No output: 204 response
    if (xmlOutput == null)
      return Response.noContent().build();
    
    // Error in Stanford CoreNLP: 500 error
    if (xmlOutput.startsWith(StanfordCoreNLPServer.DEFAULT_ERROR_MESSAGE))
      return Response.serverError().type(MediaType.TEXT_PLAIN_TYPE).entity(xmlOutput).build();
    
    // Successful response
    return Response.created(uriInfo.getRequestUri()).type(MediaType.APPLICATION_XML).entity(xmlOutput).build();
  }

}
