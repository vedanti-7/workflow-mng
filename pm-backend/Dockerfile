# Use a lighter image for faster builds
FROM eclipse-temurin:17-jdk
# This is now the /app folder inside your pm-backend directory
WORKDIR /app
# Copy everything from pm-backend into the container
COPY . .
# Ensure the Maven wrapper is executable
RUN chmod +x mvnw
# Build the application
RUN ./mvnw clean package -DskipTests
# Expose the default Spring Boot port
EXPOSE 8080
# Run the jar. Using a wildcard can sometimes fail if multiple jars exist, 
# so we point specifically to the target folder.
CMD ["sh", "-c", "java -jar target/*.jar"]